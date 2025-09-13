#!/usr/bin/env node

/**
 * Quick Test Script for Finance Tracker API
 * Запуск: node quick-test.js
 */

const baseUrl = 'http://localhost:3002';

async function testHealth() {
  console.log('🔍 Testing API Health...');
  try {
    const response = await fetch(`${baseUrl}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Health OK:', data);
      return true;
    } else {
      console.log('❌ API Health Failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ API not reachable:', error.message);
    console.log('📝 Make sure API is running on port 3001');
    console.log('   cd apps/api && npm run dev');
    return false;
  }
}

async function testMockAuth() {
  console.log('\n🔍 Testing Mock Auth (Development only)...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/mock`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Mock Auth OK');
      console.log('📋 Mock initData created:', data.data?.initData?.substring(0, 50) + '...');
      return data.data?.initData;
    } else {
      console.log('❌ Mock Auth Failed:', data.error || data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Mock Auth Error:', error.message);
    return null;
  }
}

async function testTelegramAuth(initData) {
  console.log('\n🔍 Testing Telegram Auth...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ initData })
    });
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Telegram Auth OK');
      console.log('👤 User:', data.data.user.first_name);
      console.log('🔑 Token received (length):', data.data.token.length);
      return data.data.token;
    } else {
      console.log('❌ Telegram Auth Failed:', data.error || data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Telegram Auth Error:', error.message);
    return null;
  }
}

async function testAuthMe(token) {
  console.log('\n🔍 Testing Auth Me...');
  try {
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Auth Me OK');
      console.log('👤 User ID:', data.data.user.id);
      console.log('💰 Total Balance:', data.data.total_balance);
      return true;
    } else {
      console.log('❌ Auth Me Failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Auth Me Error:', error.message);
    return false;
  }
}

async function testCategories(token) {
  console.log('\n🔍 Testing Categories...');
  try {
    const response = await fetch(`${baseUrl}/api/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Categories OK');
      console.log('📋 Categories found:', data.data?.length || 0);
      
      if (data.data?.length > 0) {
        console.log('📝 Sample categories:', data.data.slice(0, 3).map(cat => 
          `${cat.icon} ${cat.name} (${cat.type})`
        ));
      }
      return true;
    } else {
      console.log('❌ Categories Failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Categories Error:', error.message);
    return false;
  }
}

async function testAccounts(token) {
  console.log('\n🔍 Testing Accounts...');
  try {
    const response = await fetch(`${baseUrl}/api/accounts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Accounts OK');
      console.log('💳 Accounts found:', data.data?.length || 0);
      
      if (data.data?.length > 0) {
        console.log('📝 Sample accounts:', data.data.map(acc => 
          `${acc.icon} ${acc.name}: ${acc.balance} ${acc.currency}`
        ));
      }
      return true;
    } else {
      console.log('❌ Accounts Failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Accounts Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Finance Tracker API Quick Test\n');
  
  // Test 1: Health Check
  const healthOk = await testHealth();
  if (!healthOk) {
    console.log('\n❌ API не запущен или не отвечает. Остановка тестов.');
    process.exit(1);
  }
  
  // Test 2: Mock Auth (for development)
  const initData = await testMockAuth();
  if (!initData) {
    console.log('\n⚠️ Mock Auth не работает. Проверьте настройки Supabase.');
    console.log('📝 Убедитесь что:');
    console.log('   - Supabase проект создан');
    console.log('   - Схема БД применена из supabase-schema.sql');
    console.log('   - Переменные окружения заполнены в apps/api/.env');
    process.exit(1);
  }
  
  // Test 3: Telegram Auth
  const token = await testTelegramAuth(initData);
  if (!token) {
    console.log('\n❌ Telegram Auth не работает. Проверьте настройки.');
    process.exit(1);
  }
  
  // Test 4: Auth Me
  const authMeOk = await testAuthMe(token);
  if (!authMeOk) {
    console.log('\n❌ Auth Me не работает.');
    process.exit(1);
  }
  
  // Test 5: Categories
  await testCategories(token);
  
  // Test 6: Accounts
  await testAccounts(token);
  
  console.log('\n🎉 Все основные тесты пройдены!');
  console.log('\n📋 Что дальше:');
  console.log('   1. Настройте реальный Telegram бот');
  console.log('   2. Протестируйте фронтенд на http://localhost:3003');
  console.log('   3. Создайте транзакции через UI');
  console.log('   4. Протестируйте в реальном Telegram (через ngrok)');
}

// Запуск тестов
runTests().catch(console.error);