#!/usr/bin/env node

/**
 * Supabase Connection Debug Script
 * Проверяет подключение к Supabase и права доступа
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

async function debugSupabase() {
  console.log('🔍 Supabase Connection Debug\n');

  // Проверяем переменные окружения
  console.log('📋 Environment Variables:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n❌ Missing required environment variables');
    return;
  }

  // Создаем клиенты
  const supabaseAnon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n🔗 Testing connections...\n');

  // Тест 1: Проверяем подключение через health check
  try {
    console.log('1. Testing basic connection...');
    const { data, error } = await supabaseAnon.from('categories').select('count').limit(1);
    if (error) {
      console.log('❌ Connection failed:', error.message);
      console.log('   Details:', error);
    } else {
      console.log('✅ Basic connection OK');
    }
  } catch (err) {
    console.log('❌ Connection error:', err.message);
  }

  // Тест 2: Проверяем таблицы
  console.log('\n2. Checking tables...');
  
  const tables = ['users', 'accounts', 'categories', 'transactions'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ Table "${table}":`, error.message);
      } else {
        console.log(`✅ Table "${table}": OK`);
      }
    } catch (err) {
      console.log(`❌ Table "${table}" error:`, err.message);
    }
  }

  // Тест 3: Проверяем дефолтные категории
  console.log('\n3. Checking default categories...');
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_default', true)
      .limit(5);
    
    if (error) {
      console.log('❌ Default categories error:', error.message);
      console.log('   Details:', error);
    } else {
      console.log(`✅ Found ${data?.length || 0} default categories`);
      if (data && data.length > 0) {
        console.log('   Sample categories:', data.slice(0, 3).map(cat => 
          `${cat.icon} ${cat.name} (${cat.type})`
        ));
      }
    }
  } catch (err) {
    console.log('❌ Categories error:', err.message);
  }

  // Тест 4: Проверяем создание тестового пользователя
  console.log('\n4. Testing user creation flow...');
  try {
    // Создаем тестового пользователя в auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `test-${Date.now()}@telegram.local`,
      user_metadata: {
        telegram_id: 12345,
        first_name: 'Test User'
      },
      email_confirm: true
    });

    if (authError) {
      console.log('❌ Auth user creation failed:', authError.message);
      console.log('   Details:', authError);
    } else {
      console.log('✅ Auth user created:', authUser.user?.id);
      
      // Пробуем создать запись в users таблице
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .insert([{
          id: authUser.user?.id,
          telegram_id: 12345,
          first_name: 'Test User'
        }])
        .select();

      if (userError) {
        console.log('❌ User table insert failed:', userError.message);
        console.log('   Details:', userError);
      } else {
        console.log('✅ User table insert OK');
        
        // Очищаем тестовые данные
        await supabaseAdmin.from('users').delete().eq('id', authUser.user?.id);
        await supabaseAdmin.auth.admin.deleteUser(authUser.user?.id);
        console.log('✅ Test data cleaned up');
      }
    }
  } catch (err) {
    console.log('❌ User creation test error:', err.message);
  }

  // Тест 5: Проверяем RLS политики
  console.log('\n5. Testing RLS policies...');
  try {
    // Попробуем запрос без авторизации (должен провалиться)
    const { data, error } = await supabaseAnon.from('users').select('*').limit(1);
    
    if (error) {
      if (error.message.includes('RLS') || error.message.includes('policy')) {
        console.log('✅ RLS policies are working (blocking unauthorized access)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    } else {
      console.log('⚠️ RLS might not be working properly (got data without auth)');
    }
  } catch (err) {
    console.log('❌ RLS test error:', err.message);
  }

  console.log('\n🎯 Debug Summary:');
  console.log('If all basic tests pass but auth still fails, the issue might be:');
  console.log('1. RLS policies blocking service role access');
  console.log('2. Telegram initData validation failing');
  console.log('3. JWT secret or environment variable mismatch');
  console.log('\n📝 Next steps: Check the specific error in API logs');
}

debugSupabase().catch(console.error);