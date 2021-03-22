import React, { useState } from 'react';
import { Header, Label, Button, Table, Input } from 'semantic-ui-react';
import Select from 'react-select';
import { filter, findIndex, cloneDeep } from 'lodash';
// import ProxyBased from './ProxyBased'
import 'semantic-ui-css/semantic.min.css';
import './App.scss';

const TIMER = 3000;

function App() {
  const [mode, setMode] = useState({ label: '', value: '' });
  const [cachingInput, setCachingInput] = useState({
    broadcast: 'ABACAD',
    client_req: 'ABCBAA',
    num_of_pages: '1',
  });
  const [pix, setPix] = useState({});

  const getModeOptions = () => {
    return [
      {
        label: 'Caching',
        value: 'CACHING',
      },
      {
        label: 'Indexing',
        value: 'INDEXING',
      },
    ];
  };

  const handleInputChange = (key) => (event) => {
    const cachingInputClone = { ...cachingInput };
    cachingInputClone[key] = event.target.value;
    setCachingInput(cachingInputClone);
  };

  const getPageFrequencies = (content) => {
    const pageFrequencies = {};
    for (let i = 0; i < content.length; i += 1) {
      if (pageFrequencies[content[i]]) {
        pageFrequencies[content[i]] += 1;
      } else {
        pageFrequencies[content[i]] = 1;
      }
    }
    return pageFrequencies;
  };

  const calculatePIX = () => {
    const frequenciesHashMap = getPageFrequencies(cachingInput.broadcast);
    const probabilitiesHashMap = getPageFrequencies(cachingInput.client_req);
    const pixHashMap = {};
    Object.keys(probabilitiesHashMap).map((page) => {
      const pix =
        probabilitiesHashMap[page] /
        cachingInput.client_req.length /
        (frequenciesHashMap[page] / cachingInput.broadcast.length);
      pixHashMap[page] = pix;
    });
    setPix(pix);
    calculatePIXSteps();
  };

  const calculatePIXSteps = () => {
    const clientReq = [...cachingInput.client_req];
    const broadcast = [...cachingInput.broadcast];
    const steps = [];
    const cache = new Array(Number(cachingInput.num_of_pages)).fill('NULL');
    while (clientReq.length) {
      const dataForClient = clientReq[0];
      if (cache.includes(dataForClient)) {
        console.log(`${dataForClient} found in cache`);
        clientReq.shift();
      } else {
        for (let i = 0; i < broadcast.length; i += 1) {
          const itemServing = broadcast[i];
          if (itemServing === dataForClient) {
            clientReq.shift();
            const nullIndex = findIndex(cache, 'NULL');
            if (nullIndex >= 0) cache[nullIndex] = dataForClient;
          }
        }
      }
    }
  };

  return (
    <div className="App">
      <div
        className="App-div"
        style={{ margin: '15px', padding: '15px', display: 'flex' }}
      >
        <div
          style={{
            width: '20%',
            height: '100vh',
            borderRight: '1px solid silver',
          }}
        >
          <Header as="h3">Select Mode</Header>
          <div className="select-cache">
            <label>Mode</label>
            <Select
              value={mode}
              onChange={setMode}
              options={getModeOptions()}
            />
          </div>
          {mode.value === 'CACHING' && (
            <>
              <div>
                <div className="select-cache">
                  <label>Broadcast</label>
                  <Input
                    value={cachingInput.broadcast}
                    onChange={handleInputChange('broadcast')}
                  />
                </div>
                <div className="select-cache">
                  <label>Client Request</label>
                  <Input
                    value={cachingInput.client_req}
                    onChange={handleInputChange('client_req')}
                  />
                </div>
                <div className="select-cache">
                  <label>No. of pages to cache</label>
                  <Input
                    value={cachingInput.num_of_pages}
                    onChange={handleInputChange('num_of_pages')}
                  />
                </div>
                <div className="select-cache cache-buttons">
                  <Button primary onClick={calculatePIX}>
                    Get PIX
                  </Button>
                </div>
              </div>
            </>
          )}
          {mode.value === 'INDEXING' && (
            <>
              <div>
                <div className="select-cache">
                  <label>Select Request Source</label>
                </div>
                <div className="select-cache cache-buttons">
                  <Button primary onClick={console}>
                    Submit Request
                  </Button>
                </div>
              </div>
              <div>
                <Header as="h3">Move MH</Header>
                <div className="select-cache">
                  <label>Select MH</label>
                </div>
                <div className="select-cache">
                  <label>Select MSS</label>
                </div>
                <div className="select-cache cache-buttons">
                  <Button primary>Move</Button>
                </div>
              </div>
              <div>
                <div className="select-cache">
                  <label>Select Token Location</label>
                </div>
              </div>
            </>
          )}
        </div>
        {mode.value === 'CACHING' && (
          <div style={{ display: 'flex' }}>
            <div id="treeWrapper" style={{ width: '70%', marginLeft: '15px' }}>
              Caching
            </div>
          </div>
        )}
        {mode.value === 'INDEXING' && (
          <div>
            <div style={{ display: 'flex' }}>
              <div id="treeWrapper" style={{ marginLeft: '15px' }}>
                Indexing
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
