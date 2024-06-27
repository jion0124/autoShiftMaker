const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const employees = ['土井', '小川', '猿田', '宮田', '齊藤', '菅原', '渡辺', '藤代', '白鳥', '川村'];
const days = Array.from({ length: 31 }, (_, i) => new Date(2024, 6, i + 1)); // July 2024

app.post('/generate_shifts', (req, res) => {
  const { preferredDays, offDays } = req.body;

  const schedule = days.reduce((acc, day) => {
    const dayKey = day.toISOString().split('T')[0];
    acc[dayKey] = {};
    employees.forEach(employee => {
      acc[dayKey][employee] = '';
    });
    return acc;
  }, {});

  // 1週間のうち2日休み、平日は2人が休み、土日は3人が出勤
  let employeeIndex = 0;

  for (let weekStart = 0; weekStart < days.length; weekStart += 7) {
    for (let i = 0; i < 7; i++) {
      const day = days[weekStart + i];
      if (!day) break;
      const dayKey = day.toISOString().split('T')[0];

      // 休みの割り当て
      let offCount = day.getDay() === 0 || day.getDay() === 6 ? employees.length - 3 : 2;
      let assignedOffCount = 0;

      while (assignedOffCount < offCount) {
        const employee = employees[employeeIndex % employees.length];
        if (schedule[dayKey][employee] === '') {
          schedule[dayKey][employee] = '公';
          assignedOffCount++;
        }
        employeeIndex++;
      }
    }
  }

  // 役割のランダム割り当て（但し土井以外）
  for (let day of days) {
    const dayKey = day.toISOString().split('T')[0];
    let availableUsers = employees.filter(employee => schedule[dayKey][employee] !== '公' && employee !== '土井');

    if (availableUsers.length > 0) {
      let earlyUser = selectRandomUser(availableUsers);
      schedule[dayKey][earlyUser] = '早';
      availableUsers = availableUsers.filter(user => user !== earlyUser);
    }

    if (availableUsers.length > 0) {
      let cleanUser = selectRandomUser(availableUsers);
      schedule[dayKey][cleanUser] = '★';
      availableUsers = availableUsers.filter(user => user !== cleanUser);
    }

    if (availableUsers.length > 0) {
      let inspectUser = selectRandomUser(availableUsers);
      schedule[dayKey][inspectUser] = '検';
    }
  }

  console.log(schedule); // シフトデータをログに出力
  res.json(schedule);
});

function selectRandomUser(users) {
  return users[Math.floor(Math.random() * users.length)];
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
