import React, { useState } from 'react';
import ApiForm from './components/ApiForm';

const App: React.FC = () => {
  const [apiData, setApiData] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);

  return (
    <div className="App">
      <h1>API Form</h1>
      <ApiForm setApiData={setApiData} apiData={apiData} data={data} />
    </div>
  );
};

export default App;
