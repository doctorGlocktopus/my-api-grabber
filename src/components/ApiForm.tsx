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
  const [excludedColumns, setExcludedColumns] = useState<Record<string, boolean>>({});
  const [exportMenue, setExportMenue] = useState(false);
  const [endpoint, setEndpoint] = useState("CSV");

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
      const headers: Record<string, string> = apiKeys.reduce((acc, { key, value }) => {
        if (key && value) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
  
      const response = await fetch(url, { method: 'GET', headers });
      const textResponse = await response.text();
      let fetchedData: any;
  
      try {
        fetchedData = JSON.parse(textResponse);
      } catch {
        fetchedData = {};
      }

      if (fetchedData.joke) {
        setApiData([fetchedData]);
      } else {
        setApiData([]);
      }
  
      const columns = Object.keys(fetchedData || {});
      const columnsObject = columns.reduce<Record<string, boolean>>((acc, column) => {
        acc[column] = true;
        return acc;
      }, {});
  
      setAllColumns(columnsObject);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error fetching data');
    }
  };
  
  

  const exportData = (fileFormat: string) => {
    const exportRequest = {
      url: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        columns: Object.keys(apiData[0] || {}),
        url: url,
        excludedColumns: excludedColumns,
        apiKeys: {},
        filters: {},
      }),
    };
    setEndpoint(fileFormat)

    fetch(`http://localhost:3001/api/${endpoint}`, exportRequest)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data.${fileFormat.toLowerCase()}`;
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
      setExcludedColumns(newColumns);
      return newColumns;
    });
  };

  const renderCellData = (data: any) => {
    console.log(data)
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([key, value]) => (
        <div key={key}>{`${key}: ${value}`}</div>
      ));
    }
    return data;
  };

  return (
    <div>
      <input
        type="text"
        placeholder="API URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      {/* API Key Inputs */}
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
      {/* Buttons */}
      <div onMouseLeave={() => setExportMenue(false)}>
        <button onClick={addApiKey}>Add API Key</button>
        <button onClick={fetchData}>Fetch Data</button>
        <button onClick={() => exportData(endpoint)} onMouseEnter={() => setExportMenue(!exportMenue)}>
          Export Data ({endpoint})
        </button>
          {exportMenue && (
            <>
              <button onMouseEnter={() => setEndpoint('PDF')} onClick={() => exportData('PDF')}>PDF</button>
              <button onMouseEnter={() => setEndpoint('CSV')} onClick={() => exportData('CSV')}>CSV</button>
              <button onMouseEnter={() => setEndpoint('JPG')} onClick={() => exportData('JPG')}>JPG</button>
              <button onMouseEnter={() => setEndpoint('PNG')} onClick={() => exportData('PNG')}>PNG</button>
              <button onMouseEnter={() => setEndpoint('JSON')} onClick={() => exportData('JSON')}>JSON</button>
            </>
          )}
        <button onClick={invertAllSelections}>Invert Selection</button>
      </div>
      {/* Column Visibility */}
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
      {/* Data Table */}
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
                      {typeof item[column] === 'object' ? renderCellData(item) : renderCellData(item[column])}
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