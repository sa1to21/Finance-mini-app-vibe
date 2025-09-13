#!/usr/bin/env node

/**
 * Add test data to database for current user
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

async function addTestData() {
  console.log('📊 Adding test data to database...');
  
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get current user (should be the test user we just created)
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('telegram_id', 12345)
      .limit(1);

    if (!users || users.length === 0) {
      console.log('❌ No test user found. Run quick-test.js first to create user.');
      return;
    }

    const user = users[0];
    console.log(`👤 Found user: ${user.first_name} (${user.id})`);

    // 1. Add test accounts
    console.log('\n💳 Adding test accounts...');
    const testAccounts = [
      {
        user_id: user.id,
        name: 'Основная карта',
        type: 'card',
        balance: 25450.00,
        currency: 'RUB',
        icon: '💳',
        color: '#3B82F6',
        is_active: true
      },
      {
        user_id: user.id,
        name: 'Наличные',
        type: 'cash',
        balance: 5230.00,
        currency: 'RUB', 
        icon: '💰',
        color: '#10B981',
        is_active: true
      },
      {
        user_id: user.id,
        name: 'Сбережения',
        type: 'bank',
        balance: 125000.00,
        currency: 'RUB',
        icon: '🏦',
        color: '#8B5CF6',
        is_active: true
      }
    ];

    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .insert(testAccounts)
      .select();

    if (accountsError) {
      console.log('❌ Error adding accounts:', accountsError.message);
    } else {
      console.log(`✅ Added ${accounts.length} test accounts`);
      accounts.forEach(acc => console.log(`   ${acc.icon} ${acc.name}: ${acc.balance} ${acc.currency}`));
    }

    // 2. Add test transactions
    if (accounts && accounts.length > 0) {
      console.log('\n💸 Adding test transactions...');
      
      const cardAccount = accounts.find(a => a.type === 'card');
      const cashAccount = accounts.find(a => a.type === 'cash');

      // Get some categories for transactions
      const { data: categories } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('is_default', true)
        .limit(10);

      if (categories && categories.length > 0) {
        const expenseCategories = categories.filter(c => c.type === 'expense');
        const incomeCategories = categories.filter(c => c.type === 'income');

        const testTransactions = [];

        // Add some expenses
        if (expenseCategories.length > 0 && cardAccount) {
          testTransactions.push(
            {
              user_id: user.id,
              account_id: cardAccount.id,
              category_id: expenseCategories[0].id, // Продукты
              type: 'expense',
              amount: 1250.00,
              description: 'Покупки в супермаркете',
              date: new Date().toISOString()
            },
            {
              user_id: user.id,
              account_id: cardAccount.id,
              category_id: expenseCategories[1].id, // Транспорт
              type: 'expense', 
              amount: 85.00,
              description: 'Проезд в метро',
              date: new Date(Date.now() - 86400000).toISOString() // вчера
            }
          );
        }

        // Add some income
        if (incomeCategories.length > 0 && cardAccount) {
          testTransactions.push({
            user_id: user.id,
            account_id: cardAccount.id,
            category_id: incomeCategories[0].id,
            type: 'income',
            amount: 50000.00,
            description: 'Зарплата за месяц',
            date: new Date(Date.now() - 172800000).toISOString() // 2 дня назад
          });
        }

        // Cash transactions
        if (cashAccount && expenseCategories.length > 2) {
          testTransactions.push({
            user_id: user.id,
            account_id: cashAccount.id,
            category_id: expenseCategories[2].id, // Развлечения
            type: 'expense',
            amount: 800.00,
            description: 'Кино с друзьями',
            date: new Date(Date.now() - 259200000).toISOString() // 3 дня назад
          });
        }

        const { data: transactions, error: transactionsError } = await supabaseAdmin
          .from('transactions')
          .insert(testTransactions)
          .select(`
            *,
            category:categories(name, icon, type),
            account:accounts(name, icon)
          `);

        if (transactionsError) {
          console.log('❌ Error adding transactions:', transactionsError.message);
        } else {
          console.log(`✅ Added ${transactions.length} test transactions`);
          transactions.forEach(t => {
            const sign = t.type === 'income' ? '+' : '-';
            console.log(`   ${t.category.icon} ${t.description}: ${sign}${t.amount} RUB (${t.account.name})`);
          });
        }
      }
    }

    console.log('\n🎉 Test data added successfully!');
    console.log('\n📋 What you can test now:');
    console.log('   1. Check /api/accounts - should show 3 accounts');
    console.log('   2. Check /api/categories - should show default categories');  
    console.log('   3. Check /api/transactions - should show test transactions');
    console.log('   4. Test the frontend UI with real data');
    
  } catch (err) {
    console.log('❌ Error adding test data:', err.message);
  }
}

addTestData().catch(console.error);