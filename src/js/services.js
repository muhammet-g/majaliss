import { supabase } from './supabaseClient.js';

/**
 * Fetch all books from the 'books' table
 * @returns {Promise<Array>} Array of book objects
 */
export async function fetchBooks() {
    try {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch books: ${error.message}`);
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching books:', error);
        throw error;
    }
}

/**
 * Fetch all members from the 'members' table
 * @returns {Promise<Array>} Array of member objects
 */
export async function fetchMembers() {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch members: ${error.message}`);
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching members:', error);
        throw error;
    }
}

/**
 * Submit a join request by inserting a new member with pending status
 * @param {Object} memberData - Object containing { name, email, phone, reason }
 * @returns {Promise<Object>} The inserted member object
 */
export async function submitJoinRequest(memberData) {
    try {
        const { data, error } = await supabase
            .from('members')
            .insert([
                {
                    name: memberData.name,
                    email: memberData.email,
                    phone: memberData.phone,
                    reason: memberData.reason,
                    status: 'pending',
                    role: 'member',
                }
            ])
            .select();

        if (error) {
            throw new Error(`Failed to submit join request: ${error.message}`);
        }

        return data?.[0] || null;
    } catch (error) {
        console.error('Error submitting join request:', error);
        throw error;
    }
}

/**
 * Check a member's status by email
 * @param {string} email - Member's email address
 * @returns {Promise<string|null>} Member status ('active', 'pending') or null if not found
 */
export async function getMemberStatus(email) {
    try {
        const { data, error } = await supabase
            .from('members')
            .select('id, status, role')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 = no rows found, which is okay
            throw new Error(`Failed to fetch member status: ${error.message}`);
        }

        return data || null;
    } catch (error) {
        console.error('Error fetching member status:', error);
        throw error;
    }
}

/**
 * Admin function to approve a pending member (update status to 'active')
 * @param {string} memberId - UUID of the member to approve
 * @returns {Promise<Object>} The updated member object
 */
export async function adminApproveMember(memberId) {
    try {
        const { data, error } = await supabase
            .from('members')
            .update({ status: 'active' })
            .eq('id', memberId)
            .select();

        if (error) {
            throw new Error(`Failed to approve member: ${error.message}`);
        }

        return data?.[0] || null;
    } catch (error) {
        console.error('Error approving member:', error);
        throw error;
    }
}

/**
 * Admin function to reject/remove a pending member
 * @param {string} memberId - UUID of the member to reject
 * @returns {Promise<boolean>} True if deletion was successful
 */
export async function adminRejectMember(memberId) {
    try {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', memberId);

        if (error) {
            throw new Error(`Failed to reject member: ${error.message}`);
        }

        return true;
    } catch (error) {
        console.error('Error rejecting member:', error);
        throw error;
    }
}
