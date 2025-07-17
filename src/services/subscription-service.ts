'use server';

import clientPromise from '@/lib/mongodb';
import { Collection, Db, ObjectId } from 'mongodb';
import { subscriptions as staticSubscriptions } from '@/lib/data';
import { AnnualSubscription, Payment } from '@/lib/types';
import { getMembers } from '@/services/member-service';

async function getAnnualSubscriptionCollection(): Promise<Collection<Omit<AnnualSubscription, 'id'>>> {
    const client = await clientPromise;
    const db: Db = client.db("lionsManager");
    return db.collection<Omit<AnnualSubscription, 'id'>>('annualSubscriptions');
}

async function getPaymentCollection(): Promise<Collection<Omit<Payment, 'id'>>> {
    const client = await clientPromise;
    const db: Db = client.db("lionsManager");
    return db.collection<Omit<Payment, 'id'>>('payments');
}

export async function calculateSubscriptionBalanceAndStatus(subscriptionId: string): Promise<{ remainingBalance: number; status: 'Paid' | 'Unpaid' | 'Partial' }> {
    const annualSubscriptionCollection = await getAnnualSubscriptionCollection();
    const paymentCollection = await getPaymentCollection();

    const annualSubscriptionDoc = await annualSubscriptionCollection.findOne({ _id: new ObjectId(subscriptionId) });

    if (!annualSubscriptionDoc) {
        throw new Error('Annual Subscription not found.');
    }

    const payments = await paymentCollection.find({ subscriptionId: subscriptionId }).toArray();
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

    // Get carriedForwardDebt directly from the document, defaulting to 0 if not present
    const carriedForwardDebt = annualSubscriptionDoc.carriedForwardDebt || 0;

    // The total amount due for this subscription is its annual amount plus any carried forward debt
    const totalAmountDue = annualSubscriptionDoc.annualAmount + carriedForwardDebt;
    const remainingBalance = totalAmountDue - totalPaid;

    let status: 'Paid' | 'Unpaid' | 'Partial';
    if (remainingBalance <= 0) {
        status = 'Paid';
    } else if (totalPaid > 0) {
        status = 'Partial';
    } else {
        status = 'Unpaid';
    }

    await annualSubscriptionCollection.updateOne(
        { _id: new ObjectId(subscriptionId) },
        { $set: { remainingBalance: remainingBalance, status: status, updatedAt: new Date().toISOString() } }
    );

    return { remainingBalance, status };
}

export async function getAnnualSubscriptions(): Promise<AnnualSubscription[]> {
    try {
        const collection = await getAnnualSubscriptionCollection();
        const annualSubscriptions = await collection.find({}).map(doc => ({ ...doc, id: doc._id.toString() })).toArray();

        const subscriptionsWithDetails = await Promise.all(annualSubscriptions.map(async (sub) => {
            const { remainingBalance, status } = await calculateSubscriptionBalanceAndStatus(sub.id);
            return { ...sub, remainingBalance, status };
        }));

        return JSON.parse(JSON.stringify(subscriptionsWithDetails));
    } catch (error) {
        console.error('Error fetching annual subscriptions:', error);
        return [];
    }
}

export async function getPaymentsForSubscription(subscriptionId: string): Promise<Payment[]> {
    try {
        const collection = await getPaymentCollection();
        const payments = await collection.find({ subscriptionId: subscriptionId }).map(doc => ({ ...doc, id: doc._id.toString() })).toArray();
        return JSON.parse(JSON.stringify(payments));
    } catch (error) {
        console.error(`Error fetching payments for subscription ${subscriptionId}:`, error);
        return [];
    }
}

export async function seedAnnualSubscriptions(): Promise<{ success: boolean, message: string }> {
    try {
        const collection = await getAnnualSubscriptionCollection();
        const count = await collection.countDocuments();

        if (count > 0) {
            return { success: true, message: 'Annual Subscriptions database already seeded.' };
        }

        const members = await getMembers();
        if (members.length === 0) {
            return { success: false, message: 'No members found to link annual subscriptions to. Please seed members first.' };
        }

        const currentYear = new Date().getFullYear();
        const annualSubscriptionsToInsert = staticSubscriptions.map((sub: any, index: number) => {
            const member = members[index % members.length];
            return {
                memberId: member.id,
                memberName: member.fullName,
                annualAmount: sub.amount,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                remainingBalance: sub.amount,
                status: 'Unpaid',
                subscriptionYear: currentYear,
            };
        });
        await collection.insertMany(annualSubscriptionsToInsert as any[]); // Cast to any[] to bypass type checking for _id

        // After seeding annual subscriptions, calculate initial balances and statuses
        const seededSubscriptions = await collection.find({}).toArray();
        for (const sub of seededSubscriptions) {
            await calculateSubscriptionBalanceAndStatus(sub._id.toString());
        }

        return { success: true, message: `Database seeded successfully with ${annualSubscriptionsToInsert.length} annual subscriptions.` };
    } catch (error) {
        console.error('Error seeding annual subscriptions:');
        console.error(error);
        if (error instanceof Error) {
            console.error(error.stack);
        }
        return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function addAnnualSubscription(annualSubscription: Omit<AnnualSubscription, 'id' | 'remainingBalance' | 'status'> & { subscriptionYear: number }): Promise<{ success: boolean; message: string; subscriptionId?: string }> {
    try {
        const annualSubscriptionCollection = await getAnnualSubscriptionCollection();
        const paymentCollection = await getPaymentCollection();
        const now = new Date().toISOString();

        // Check for existing subscription for the same member and year
        const existingSubscription = await annualSubscriptionCollection.findOne({
            memberId: annualSubscription.memberId,
            subscriptionYear: annualSubscription.subscriptionYear,
        });

        if (existingSubscription) {
            return { success: false, message: `Annual subscription for year ${annualSubscription.subscriptionYear} already exists for this member.` };
        }

        let initialRemainingBalance = annualSubscription.annualAmount;
        const paymentsForNewSubscription: Omit<Payment, 'id'>[] = [];

        // --- Logic for carrying forward positive remaining balance (debt) from previous years ---
        const previousUnpaidSubscriptions = await annualSubscriptionCollection.find({
            memberId: annualSubscription.memberId,
            remainingBalance: { $gt: 0 }, // Find subscriptions where balance is still owed
        }).toArray();

        let totalDebtCarriedForward = 0;
        for (const prevSub of previousUnpaidSubscriptions) {
            if (prevSub.remainingBalance > 0) {
                totalDebtCarriedForward += prevSub.remainingBalance;

                // Create a payment record to clear the previous subscription's balance
                await paymentCollection.insertOne({
                    subscriptionId: prevSub._id.toString(),
                    amountPaid: prevSub.remainingBalance,
                    paymentDate: now,
                    method: 'Debt Transfer',
                    notes: `Debt of ₹${prevSub.remainingBalance.toFixed(2)} transferred to ${annualSubscription.subscriptionYear} subscription.`
                });

                // Update the previous subscription's remaining balance to 0 and status to Paid
                await annualSubscriptionCollection.updateOne(
                    { _id: prevSub._id },
                    { $set: { remainingBalance: 0, status: 'Paid', updatedAt: now } }
                );
                // Recalculate balance and status for the previous subscription to ensure consistency
                await calculateSubscriptionBalanceAndStatus(prevSub._id.toString());
            }
        }
        initialRemainingBalance += totalDebtCarriedForward; // Add carried forward debt to the new subscription's balance

        // --- Existing logic for handling overpayments (negative remaining balance) ---
        const previousOverpaidSubscriptions = await annualSubscriptionCollection.find({
            memberId: annualSubscription.memberId,
            remainingBalance: { $lt: 0 }, // Look for overpayments
        }).toArray();

        let totalOverpayment = 0;
        for (const prevSub of previousOverpaidSubscriptions) {
            if (prevSub.remainingBalance < 0) {
                totalOverpayment += Math.abs(prevSub.remainingBalance);
            }
        }

        if (totalOverpayment > 0) {
            let amountToApply = Math.min(totalOverpayment, initialRemainingBalance); // Apply overpayment to the new initial remaining balance
            initialRemainingBalance -= amountToApply;

            paymentsForNewSubscription.push({
                subscriptionId: '', // Placeholder, will be updated with newSubscriptionId
                amountPaid: amountToApply,
                paymentDate: now,
                method: 'Overpayment Transfer',
                notes: `Applied from previous overpayment (total overpayment: ₹${totalOverpayment.toFixed(2)})`
            });

            // Distribute the applied amount back to previous subscriptions
            for (const prevSub of previousOverpaidSubscriptions) {
                if (prevSub.remainingBalance < 0 && amountToApply > 0) {
                    const amountToClear = Math.min(Math.abs(prevSub.remainingBalance), amountToApply);
                    await annualSubscriptionCollection.updateOne(
                        { _id: prevSub._id },
                        { $set: { remainingBalance: prevSub.remainingBalance + amountToClear, updatedAt: now } }
                    );
                    amountToApply -= amountToClear;
                    // Recalculate balance and status for the previous subscription to ensure consistency
                    await calculateSubscriptionBalanceAndStatus(prevSub._id.toString());
                }
            }
        }

        const result = await annualSubscriptionCollection.insertOne({
            ...annualSubscription,
            createdAt: now,
            updatedAt: now,
            remainingBalance: initialRemainingBalance,
            status: initialRemainingBalance <= 0 ? 'Paid' : (initialRemainingBalance < annualSubscription.annualAmount ? 'Partial' : 'Unpaid'),
            carriedForwardDebt: totalDebtCarriedForward, // Store the carried forward debt
        } as any); // Cast to any to bypass type checking for _id
        const newSubscriptionId = result.insertedId.toString();

        // Insert the payment record(s) for the applied overpayment, linking to the new subscription
        for (const payment of paymentsForNewSubscription) {
            await paymentCollection.insertOne({ ...payment, subscriptionId: newSubscriptionId });
        }

        await calculateSubscriptionBalanceAndStatus(newSubscriptionId); // Recalculate final balance and status
        return { success: true, message: 'Annual Subscription added successfully', subscriptionId: newSubscriptionId };
    } catch (error) {
        console.error('Error adding annual subscription:', error);
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updateAnnualSubscription(id: string, updates: Partial<Omit<AnnualSubscription, 'id' | 'remainingBalance' | 'status' | 'createdAt'>>): Promise<{ success: boolean; message: string }> {
    try {
        if (!ObjectId.isValid(id)) {
            return { success: false, message: 'Invalid annual subscription ID format.' };
        }
        const collection = await getAnnualSubscriptionCollection();
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...updates, updatedAt: new Date().toISOString() } }
        );

        if (result.matchedCount === 0) {
            return { success: false, message: 'Annual Subscription not found.' };
        }
        await calculateSubscriptionBalanceAndStatus(id); // Recalculate balance and status after update
        return { success: true, message: 'Annual Subscription updated successfully.' };
    } catch (error) {
        console.error('Error updating annual subscription:', error);
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function addPayment(payment: Omit<Payment, 'id'>): Promise<{ success: boolean; message: string }> {
    try {
        const collection = await getPaymentCollection();
        await collection.insertOne(payment);
        await calculateSubscriptionBalanceAndStatus(payment.subscriptionId); // Recalculate balance and status
        return { success: true, message: 'Payment added successfully' };
    } catch (error) {
        console.error('Error adding payment:', error);
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function updatePayment(id: string, updates: Partial<Omit<Payment, 'id'>>): Promise<{ success: boolean; message: string }> {
    try {
        if (!ObjectId.isValid(id)) {
            return { success: false, message: 'Invalid payment ID format.' };
        }
        const collection = await getPaymentCollection();
        const payment = await collection.findOne({ _id: new ObjectId(id) });
        if (!payment) {
            return { success: false, message: 'Payment not found.' };
        }

        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );
        await calculateSubscriptionBalanceAndStatus(payment.subscriptionId); // Recalculate balance and status
        return { success: true, message: 'Payment updated successfully.' };
    } catch (error) {
        console.error('Error updating payment:', error);
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}

export async function deletePayment(id: string): Promise<{ success: boolean; message: string }> {
    try {
        if (!ObjectId.isValid(id)) {
            return { success: false, message: 'Invalid payment ID format.' };
        }
        const collection = await getPaymentCollection();
        const payment = await collection.findOne({ _id: new ObjectId(id) });
        if (!payment) {
            return { success: false, message: 'Payment not found.' };
        }

        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return { success: false, message: 'Payment not found.' };
        }
        await calculateSubscriptionBalanceAndStatus(payment.subscriptionId); // Recalculate balance and status
        return { success: true, message: 'Payment deleted successfully.' };
    } catch (error) {
        console.error('Error deleting payment:', error);
        return { success: false, message: error instanceof Error ? error.message : 'An unknown error occurred' };
    }
}
