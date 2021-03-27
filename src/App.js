import React, { useState } from 'react';
import { Header, Button, Input } from 'semantic-ui-react';
import Select from 'react-select';
import { minBy, indexOf } from 'lodash';
import 'react-perfect-scrollbar/dist/css/styles.css';
import 'semantic-ui-css/semantic.min.css';
import ScrollArea from 'react-perfect-scrollbar';
import './App.scss';

const TIMER = 3000;

function App() {
  const [mode, setMode] = useState({ label: '', value: '' });
  const [cachingInput, setCachingInput] = useState({
    broadcast: 'ABACAD',
    client_req: 'ABCBAA',
    num_of_pages: '2',
  });
  const [pix, setPix] = useState({});
  const [pixSteps, setPixSteps] = useState([]);

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
    setPix(pixHashMap);
    const { steps, pixLogs } = calculatePIXSteps(pixHashMap);
    pixLogs.push(`
    -----------------------------------------`);
    pixLogs.push(`Total Steps: ${steps}`);
    pixLogs.push(`-----------------------------------------`);
    setPixSteps(pixLogs);
    console.log(`PIX total steps: ${steps}, ${pixLogs}`);
  };

  const calculatePIXSteps = (
    pixHashMap,
    clientReq = [...cachingInput.client_req],
    broadcastIndex = 0,
    steps = 0,
    cache = new Array(Number(cachingInput.num_of_pages)).fill('NULL'),
    pixLogs = [],
    broadcast = [...cachingInput.broadcast]
  ) => {
    const itemServing = broadcast[broadcastIndex];
    const itemNeeded = clientReq[0];
    pixLogs.push(`Item serving: ${itemServing}`);
    pixLogs.push(`Item needed: ${itemNeeded}`);
    if (clientReq.length === 0) return { steps, pixLogs };
    if (cache.includes(itemNeeded)) {
      pixLogs.push(`${itemNeeded} found in cache.`);
      pixLogs.push(`Serving ${itemNeeded} from cache now.`);
      clientReq.shift();
      pixLogs.push(`***********************************************`);
      pixLogs.push(`State after each iteration:`);
      pixLogs.push(`Client Request: ${clientReq}`);
      pixLogs.push(`Next Broadcast Item: ${broadcast[broadcastIndex]}`);
      pixLogs.push(`Number of Steps: ${steps}`);
      pixLogs.push(`Cache: ${cache}`);
      pixLogs.push(`***********************************************`);
      return calculatePIXSteps(
        pixHashMap,
        clientReq,
        broadcastIndex,
        steps,
        cache,
        pixLogs
      );
    } else {
      if (itemNeeded === itemServing) {
        clientReq.shift();
        if (itemNeeded !== clientReq[0]) {
          broadcastIndex += 1;
          steps += 1;
        }
      } else {
        broadcastIndex += 1;
        steps += 1;
      }
      if (broadcastIndex > broadcast.length - 1) {
        broadcastIndex = 0;
      }
      const cachedItems = cache
        .filter((item) => item !== 'NULL')
        .map((item) => ({ itemName: item, itemPIX: pixHashMap[item] }));
      const leastPix = minBy(cachedItems, (item) => item.itemPIX);
      const currentItemPix = pixHashMap[itemServing];
      if (leastPix === undefined) {
        cache[0] = itemServing;
        pixLogs.push(`Cache after update (initial): ${cache}`);
      } else if (cachedItems.length < cache.length) {
        const nullIndex = indexOf(cache, 'NULL');
        if (nullIndex >= 0 && !cache.includes(itemServing)) {
          cache[nullIndex] = itemServing;
          pixLogs.push(`Adding ${itemServing} to cache at index ${nullIndex}`);
          pixLogs.push(`Cache after update (general): ${cache}`);
        }
      } else if (currentItemPix > leastPix.itemPIX) {
        // console.log('Cache already full...updating cache based on PIX');
        const leastPixCacheIndex = indexOf(cache, leastPix.itemName);
        cache[leastPixCacheIndex] = itemServing;
        pixLogs.push(`Cache after update based on PIX: ${cache}`);
      } else {
        pixLogs.push('No changes in cache');
      }
      pixLogs.push(`***********************************************`);
      pixLogs.push(`State after each iteration:`);
      pixLogs.push(`Client Request: ${clientReq}`);
      pixLogs.push(`Next Broadcast Item: ${broadcast[broadcastIndex]}`);
      pixLogs.push(`Number of Steps: ${steps}`);
      pixLogs.push(`Cache: ${cache}`);
      pixLogs.push(`***********************************************`);
      return calculatePIXSteps(
        pixHashMap,
        clientReq,
        broadcastIndex,
        steps,
        cache,
        pixLogs
      );
    }
  };

  const cacheFrequency = getPageFrequencies(cachingInput.broadcast);
  const cacheProbability = getPageFrequencies(cachingInput.client_req);

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
                  <div>Broadcast</div>
                  <Input
                    value={cachingInput.broadcast}
                    onChange={handleInputChange('broadcast')}
                  />
                </div>
                <div className="select-cache">
                  <div>Client Request</div>
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
                    Compare Caching Schemes
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
          <div style={{ width: '70%' }}>
            <div id="treeWrapper" style={{ marginLeft: '15px' }}>
              <h2>Caching</h2>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  width: '50%',
                }}
              >
                <div>
                  <h4>Access Probabilities (PIX)</h4>
                  {Object.keys(cacheProbability).length ? (
                    <ul>
                      {Object.keys(cacheProbability).map((item) => (
                        <li>
                          {item}: {cacheProbability[item]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    ''
                  )}
                </div>
                <div>
                  <h4>Frequencies</h4>
                  {Object.keys(cacheFrequency).length ? (
                    <ul>
                      {Object.keys(cacheFrequency).map((item) => (
                        <li>
                          {item}: {cacheFrequency[item]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    ''
                  )}
                </div>
                <div>
                  <h4>PIX Values</h4>
                  {Object.keys(pix).length ? (
                    <ul>
                      {Object.keys(pix).map((item) => (
                        <li>
                          {item}: {pix[item]}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    ''
                  )}
                </div>
              </div>
              <div
                style={{
                  width: '30%',
                  borderRight: '1px solid silver',
                }}
              >
                <h3>PIX Scheme Steps</h3>
                <ScrollArea style={{ height: '60vh' }} suppressScrollX={false}>
                  {pixSteps.map((step) => (
                    <div>{step}</div>
                  ))}
                </ScrollArea>
              </div>
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
