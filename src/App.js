import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const employees = ['土井', '小川', '猿田', '宮田', '齊藤', '菅原', '渡辺', '藤代', '白鳥', '川村'];

function App() {
  const [shifts, setShifts] = useState({});
  const [month, setMonth] = useState(6); // 0: January, 6: July
  const [selectedMode, setSelectedMode] = useState('preferred'); // 'preferred', 'off', 'delete'

  const handleCellClick = (employee, dayKey) => {
    setShifts(prevShifts => {
      const updatedShifts = { ...prevShifts };
      if (!updatedShifts[dayKey]) {
        updatedShifts[dayKey] = {};
      }

      if (selectedMode === 'preferred') {
        updatedShifts[dayKey][employee] = { type: '', classname: 'bg-preferred' };
      } else if (selectedMode === 'off') {
        updatedShifts[dayKey][employee] = { type: '公', classname: 'bg-off' };
      } else if (selectedMode === 'delete') {
        if (updatedShifts[dayKey][employee]) {
          delete updatedShifts[dayKey][employee];
        }
      }

      return updatedShifts;
    });
  };

  const generateShifts = async () => {
    try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

        const response = await fetch(`${backendUrl}/generate_shifts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                preferredDays: getDaysByType('bg-preferred'),
                offDays: getDaysByType('bg-off'),
            }),
        });

        if (!response.ok) {
            throw new Error('シフトの生成に失敗しました');
        }

        const data = await response.json();

        // 希望勤務日と希望休日はそのままにして他の要素を生成
        setShifts(prevShifts => {
            const updatedShifts = { ...prevShifts };
            Object.keys(data).forEach(dayKey => {
                if (!updatedShifts[dayKey]) {
                    updatedShifts[dayKey] = {};
                }
                Object.keys(data[dayKey]).forEach(employee => {
                    if (!updatedShifts[dayKey][employee] || (updatedShifts[dayKey][employee].classname !== 'bg-preferred' && updatedShifts[dayKey][employee].classname !== 'bg-off')) {
                        updatedShifts[dayKey][employee] = data[dayKey][employee];
                    }
                });
            });
            return updatedShifts;
        });
    } catch (error) {
        console.error('シフトの生成エラー:', error);
        alert('シフトの生成エラー: ' + error.message);
    }
};

  const getDaysByType = (classname) => {
    const days = {};
    for (const [dayKey, employees] of Object.entries(shifts)) {
      for (const [employee, shiftType] of Object.entries(employees)) {
        if (shiftType.classname === classname) {
          if (!days[employee]) {
            days[employee] = [];
          }
          days[employee].push(dayKey);
        }
      }
    }
    return days;
  };

  const renderShifts = () => {
    const daysInMonth = new Date(2024, month + 1, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(2024, month, i + 1);
        const dayKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        return {
            day: i + 1,
            dayKey,
            weekday: date.toLocaleDateString('ja-JP', { weekday: 'short' }),
            weekdayClass: date.getDay() === 0 ? 'text-sunday' : date.getDay() === 6 ? 'text-blue' : ''
        };
    });

    return (
        <table className="table table-bordered table-sm">
            <thead>
                <tr>
                    <th></th>
                    {dates.map(date => (
                        <th key={date.day}>{date.day}</th>
                    ))}
                </tr>
                <tr>
                    <th>曜日</th>
                    {dates.map(date => (
                        <th key={date.day} className={date.weekdayClass}>{date.weekday}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {employees.map((employee, i) => (
                    <tr key={i}>
                        <td>{employee}</td>
                        {dates.map(date => {
                            const dayKey = date.dayKey;
                            const shift = (shifts[dayKey] && shifts[dayKey][employee]) ? shifts[dayKey][employee] : { type: '', classname: '' };
                            let className = shift.classname || '';
                            let content = shift.type || '';

                            if (shift.type === '公' && shift.classname === 'bg-off') {
                                content = '公';
                                className = 'bg-off';
                            } else if (shift.classname === 'bg-preferred') {
                                content = '';
                                className = 'bg-preferred';
                            }

                            const textClass = (content === '早' || content === '★' || content === '検') ? 'text-red' : '';

                            return (
                                <td
                                    key={date.day}
                                    className={`${className} ${textClass}`}
                                    onClick={() => handleCellClick(employee, dayKey)}
                                >
                                    {content}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};


  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">シフトスケジューラー</h1>
      <div className="mb-4 text-center">
        <label className="mr-3">
          <input
            type="radio"
            name="mode"
            value="preferred"
            checked={selectedMode === 'preferred'}
            onChange={() => setSelectedMode('preferred')}
          />
          希望勤務日
        </label>
        <label className="mr-3">
          <input
            type="radio"
            name="mode"
            value="off"
            checked={selectedMode === 'off'}
            onChange={() => setSelectedMode('off')}
          />
          希望休
        </label>
        <label className="mr-3">
          <input
            type="radio"
            name="mode"
            value="delete"
            checked={selectedMode === 'delete'}
            onChange={() => setSelectedMode('delete')}
          />
          削除
        </label>
      </div>
      <button className="btn btn-success mb-4" onClick={generateShifts}>シフトを生成</button>
      {renderShifts()}
    </div>
  );
}

export default App;
