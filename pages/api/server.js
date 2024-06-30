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
const days = Array.from({ length: 31 }, (_, i) => new Date(Date.UTC(2024, 6, i + 1))); // July 2024 in UTC

// 土井の土日を休みに設定
const weekendOffForDoi = days.filter(day => day.getUTCDay() === 0 || day.getUTCDay() === 6).map(day => new Date(day.getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0]);

app.post('/generate_shifts', (req, res) => {
    const { preferredDays = {}, offDays = {} } = req.body;

    // 土井の土日を休みとして追加（背景色なし）
    const initialOffDays = { ...offDays, '土井': [...(offDays['土井'] || []), ...weekendOffForDoi] };

    const schedule = days.reduce((acc, day) => {
        const localDay = new Date(day.getTime() + (9 * 60 * 60 * 1000)); // UTC+9 for JST
        const dayKey = localDay.toISOString().split('T')[0];
        acc[dayKey] = {};
        employees.forEach(employee => {
            acc[dayKey][employee] = { type: '', classname: '' };
        });
        return acc;
    }, {});

    employees.forEach(employee => {
        const employeePreferredDays = preferredDays[employee] || [];
        const employeeOffDays = initialOffDays[employee] || [];

        // 希望休日を追加
        employeeOffDays.forEach(day => {
            if (schedule[day]) {
                schedule[day][employee] = { type: '公', classname: employee === '土井' ? '' : 'bg-off', fixed: true };
            }
        });

        // 希望勤務日を設定（希望休日を上書きしない）
        employeePreferredDays.forEach(day => {
            if (schedule[day] && !schedule[day][employee]?.fixed) {
                schedule[day][employee] = { type: '', classname: 'bg-preferred' };
            }
        });
    });

    for (let weekStart = 0; weekStart < days.length; weekStart += 7) {
        let weekOffCount = 0;

        for (let i = 0; i < 7; i++) {
            const dayIndex = weekStart + i;
            const day = days[dayIndex];
            if (!day) break;
            const localDay = new Date(day.getTime() + (9 * 60 * 60 * 1000)); // UTC+9 for JST
            const dayKey = localDay.toISOString().split('T')[0];

            const isWeekend = localDay.getUTCDay() === 0 || localDay.getUTCDay() === 6;
            const targetOffCount = isWeekend ? employees.length - 3 : 2;
            let assignedOffCount = Object.values(schedule[dayKey]).filter(v => v.type === '公').length;

            // 平日は2人休み、土日は3人出勤、それ以外休日
            while (assignedOffCount < targetOffCount) {
                const availableEmployees = employees.filter(employee => schedule[dayKey][employee].type === '' && !initialOffDays[employee]?.includes(dayKey));
                if (availableEmployees.length === 0) break; // 追加可能な従業員がいない場合はループを抜ける
                const randomEmployee = selectRandomUser(availableEmployees);
                schedule[dayKey][randomEmployee] = { type: '公', classname: '' }; // 背景を白にする
                assignedOffCount++;
                if (!isWeekend) weekOffCount++;
            }
        }
    }

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];
        const localDay = new Date(day.getTime() + (9 * 60 * 60 * 1000)); // UTC+9 for JST
        const dayKey = localDay.toISOString().split('T')[0];
        let availableUsers = employees.filter(employee => schedule[dayKey][employee].type !== '公');

        if (availableUsers.length > 0) {
            let earlyUser = selectRandomUser(availableUsers.filter(user => !initialOffDays[user]?.includes(dayKey)));
            if (earlyUser) {
                if (schedule[dayKey][earlyUser].type === '') {
                    schedule[dayKey][earlyUser] = { type: '早', classname: '' }; // 背景を白にする
                }
                availableUsers = availableUsers.filter(user => user !== earlyUser);
            }
        }

        if (availableUsers.length > 0) {
            let cleanUser = selectRandomUser(availableUsers.filter(user => !initialOffDays[user]?.includes(dayKey)));
            if (cleanUser) {
                if (schedule[dayKey][cleanUser].type === '') {
                    schedule[dayKey][cleanUser] = { type: '★', classname: '' }; // 背景を白にする
                }
                availableUsers = availableUsers.filter(user => user !== cleanUser);
            }
        }

        if (availableUsers.length > 0) {
            let inspectUser = selectRandomUser(availableUsers.filter(user => !initialOffDays[user]?.includes(dayKey)));
            if (inspectUser) {
                if (schedule[dayKey][inspectUser].type === '') {
                    schedule[dayKey][inspectUser] = { type: '検', classname: '' }; // 背景を白にする
                }
            }
        }
    }

    res.json(schedule);
});

function selectRandomUser(users) {
    return users[Math.floor(Math.random() * users.length)];
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
