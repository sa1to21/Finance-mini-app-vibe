#!/usr/bin/env node

/**
 * Cleanup test user with telegram_id 12345
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

async function cleanupTestUser() {
  console.log('🧹 Cleaning up test users...');
  
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Delete from users table
    const { data, error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('telegram_id', 12345);
    
    if (error) {
      console.log('❌ Error deleting from users table:', error.message);
    } else {
      console.log('✅ Cleaned up users table');
    }

    // Also clean up any auth users with test email pattern
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    
    for (const user of authUsers.users) {
      if (user.email && user.email.includes('test-') && user.email.includes('@telegram.local')) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        console.log('✅ Deleted auth user:', user.email);
      }
    }
    
    console.log('🎉 Cleanup completed!');
    
  } catch (err) {
    console.log('❌ Cleanup error:', err.message);
  }
}

cleanupTestUser().catch(console.error);