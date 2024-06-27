import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const employees = ['土井', '小川', '猿田', '宮田', '齊藤', '菅原', '渡辺', '藤代', '白鳥', '川村'];

function App() {
  const [shifts, setShifts] = useState({});
  const [preferredDays, setPreferredDays] = useState([]);
  const [offDays, setOffDays] = useState([]);
  const [newPreferredDay, setNewPreferredDay] = useState('');
  const [newOffDay, setNewOffDay] = useState('');
  const [month, setMonth] = useState(6); // 0: January, 6: July

  const addPreferredDay = () => {
    if (newPreferredDay) {
      setPreferredDays([...preferredDays, newPreferredDay]);
      setNewPreferredDay('');
    }
  };

  const addOffDay = () => {
    if (newOffDay) {
      setOffDays([...offDays, newOffDay]);
      setNewOffDay('');
    }
  };

  const generateShifts = async () => {
    if (preferredDays.length === 0 && offDays.length === 0) {
      alert('少なくとも1つの希望日または休み日を追加してください。');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/generate_shifts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredDays,
          offDays,
        }),
      });

      if (!response.ok) {
        throw new Error('シフトの生成に失敗しました');
      }

      const data = await response.json();
      setShifts(data);
    } catch (error) {
      console.error('シフトの生成エラー:', error);
      alert('シフトの生成エラー: ' + error.message);
    }
  };

  const renderShifts = () => {
    if (Object.keys(shifts).length === 0) {
      return <div>シフトデータがありません</div>;
    }

    const daysInMonth = new Date(2024, month + 1, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(2024, month, i + 1);
      return {
        day: i + 1,
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
                const dayKey = new Date(2024, month, date.day).toISOString().split('T')[0];
                const shift = shifts[dayKey] ? shifts[dayKey][employee] : '';
                let className = '';
                let content = '';

                if (shift === '早') {
                  className = 'text-red';
                  content = '早';
                } else if (shift === '★') {
                  className = 'text-red';
                  content = '★';
                } else if (shift === '検') {
                  className = 'text-red';
                  content = '検';
                } else if (shift === '公') {
                  className = 'bg-yellow';
                  content = '公';
                } else if (preferredDays.includes(dayKey)) {
                  className = 'bg-yellow';
                  content = '';
                }

                return (
                  <td key={date.day} className={className}>{content}</td>
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
      <div className="mb-4">
        <h2>希望勤務日</h2>
        <div className="input-group mb-3">
          <input
            type="date"
            className="form-control"
            value={newPreferredDay}
            onChange={(e) => setNewPreferredDay(e.target.value)}
          />
          <button className="btn btn-primary" onClick={addPreferredDay}>希望勤務日を追加</button>
        </div>
        <ul className="list-group">
          {preferredDays.map((day, index) => (
            <li key={index} className="list-group-item">{day}</li>
          ))}
        </ul>
      </div>
      <div className="mb-4">
        <h2>希望休</h2>
        <div className="input-group mb-3">
          <input
            type="date"
            className="form-control"
            value={newOffDay}
            onChange={(e) => setNewOffDay(e.target.value)}
          />
          <button className="btn btn-primary" onClick={addOffDay}>希望休を追加</button>
        </div>
        <ul className="list-group">
          {offDays.map((day, index) => (
            <li key={index} className="list-group-item">{day}</li>
          ))}
        </ul>
      </div>
      <button className="btn btn-success mb-4" onClick={generateShifts}>シフトを生成</button>
      {Object.keys(shifts).length > 0 && (
        <div>
          <h2>シフト</h2>
          {renderShifts()}
        </div>
      )}
    </div>
  );
}

export default App;
