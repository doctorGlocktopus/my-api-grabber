// src/components/ApiForm.tsx
import React, { useState, useEffect } from 'react';

interface ApiFormProps {
  setApiData: React.Dispatch<React.SetStateAction<any[]>>;
  apiData: any[];
  data: any[];
}

const ApiForm: React.FC<ApiFormProps> = ({ setApiData, apiData, data }) => {
  const [url, setUrl] = useState('https://v2.jokeapi.dev/joke/Any?lang=de');
  const [apiKeys, setApiKeys] = useState<{ key: string; value: string }[]>([{ key: '', value: '' }]);
  const [allColumns, setAllColumns] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      const columnsObject = columns.reduce<Record<string, boolean>>((acc, column) => {
        acc[column] = true;
        return acc;
      }, {});
      setAllColumns(columnsObject);
    }
  }, [data]);

  const fetchData = async () => {
    try {
      // Typisiere das Objekt als Record<string, string>
      const headers: Record<string, string> = apiKeys.reduce((acc, { key, value }) => {
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>); // Setze den Typ hier

      const response = await fetch(url, { method: 'GET', headers });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const textResponse = await response.text();
      let fetchedData: any[];
      try {
        fetchedData = JSON.parse(textResponse);
      } catch {
        throw new Error('Invalid JSON response');
      }

      setApiData(Array.isArray(fetchedData) ? fetchedData : [fetchedData]);

      const columns = Object.keys(fetchedData);
      const columnsObject = columns.reduce<Record<string, boolean>>((acc, column) => {
        acc[column] = true;
        return acc;
      }, {});

      setAllColumns(columnsObject);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching data', error);
      alert(`Error fetching data: ${errorMessage}`);
    }
  };

  const exportData = () => {
    fetch('http://localhost:3001/api/exportCsv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        columns: Object.keys(apiData[0] || {}),
        data: apiData,
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error exporting data:', error);
        alert('Error exporting data');
      });
  };

  const addApiKey = () => setApiKeys([...apiKeys, { key: '', value: '' }]);

  const handleApiKeyChange = (index: number, field: 'key' | 'value', value: string) => {
    const newKeys = [...apiKeys];
    newKeys[index] = { ...newKeys[index], [field]: value };
    setApiKeys(newKeys);
  };

  const toggleColumnVisibility = (column: string) => {
    setAllColumns(prev => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  const invertAllSelections = () => {
    setAllColumns(prev => {
      const newColumns = { ...prev };
      Object.keys(newColumns).forEach(column => {
        newColumns[column] = !newColumns[column];
      });
      return newColumns;
    });
  };

  const renderCellData = (data: any) => {
    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data); // Convert object to string
    }
    return data; // Render as is for strings, numbers, etc.
  };

  return (
    <div>
      <input
        type="text"
        placeholder="API URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      {apiKeys.map((apiKey, index) => (
        <div key={index}>
          <input
            type="text"
            placeholder="Key"
            value={apiKey.key}
            onChange={(e) => handleApiKeyChange(index, 'key', e.target.value)}
          />
          <input
            type="text"
            placeholder="Value"
            value={apiKey.value}
            onChange={(e) => handleApiKeyChange(index, 'value', e.target.value)}
          />
        </div>
      ))}
      <div>
        <button onClick={addApiKey}>Add API Key</button>
        <button onClick={fetchData}>Fetch Data</button>
        <button onClick={exportData}>Export Data</button>
        <button onClick={invertAllSelections}>Invert Selection</button>
      </div>
      {Object.keys(allColumns).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <h3>Column Visibility</h3>
          {Object.entries(allColumns).map(([column, isVisible]) => (
            <div key={column}>
              <label>
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleColumnVisibility(column)}
                />
                {column}
              </label>
            </div>
          ))}
        </div>
      )}
      {apiData.length > 0 && (
        <table>
          <thead>
            <tr>
              {Object.keys(allColumns).map(column =>
                allColumns[column] ? <th key={column}>{column}</th> : null
              )}
            </tr>
          </thead>
          <tbody>
            {apiData.map((item, index) => (
              <tr key={index}>
                {Object.keys(allColumns).map(column =>
                  allColumns[column] ? (
                    <td key={column}>
                      {renderCellData(item[column])}
                    </td>
                  ) : null
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ApiForm;
