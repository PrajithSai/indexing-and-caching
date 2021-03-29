import React, { useState } from 'react';
import { Header, Button, Input } from 'semantic-ui-react';
import Select from 'react-select';
import {
  minBy,
  indexOf,
  uniq,
  max,
  cloneDeep,
  findIndex,
  uniqBy,
} from 'lodash';
import Tree from 'react-d3-tree';
import { nodes } from './Nodes';
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
  const [lix, setLix] = useState({});
  const [lixSteps, setLixSteps] = useState([]);
  const [lixProbHashMap, setLixProbHashMap] = useState({});
  const [flattenedNodes, setFlattenedNodes] = useState(flatten([nodes]));
  const [entryAndDest, setEntryAndDest] = useState({
    entire: { entry: {}, dest: {} },
    partial: { entry: {}, dest: {} },
  });
  const [entirePath, setEntirePath] = useState('');
  const [partialPath, setPartialPath] = useState('');
  const [level, setLevel] = useState({ label: '', value: '' });
  const [allControlIndexes, setControlIndexes] = useState([]);
  const [allGlobalIndexes, setGlobalIndexes] = useState({});

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

  const getDynamicPathClass = ({ source, target }, orientation) => {
    if (!target.children) {
      // Target node has no children -> this link leads to a leaf node.
      return 'link__to-leaf';
    }

    // Style it as a link connecting two branch nodes by default.
    return 'link__to-branch';
  };

  const renderRectSvgNode = ({ nodeDatum, toggleNode }) => {
    const { valueByLevel } = getLevelHash(level.value);
    return (
      <g>
        <rect width="20" height="20" x="-10" onClick={toggleNode} />
        <text fill="black" strokeWidth="1" x="40">
          {nodeDatum.name}
        </text>
        {(nodeDatum.name.startsWith('a') ||
          nodeDatum.name.startsWith('b') ||
          nodeDatum.name.startsWith('c')) && (
          <text fill="black" x="20" dy="20" strokeWidth="1">
            Level: {valueByLevel[nodeDatum.name]}
          </text>
        )}
      </g>
    );
  };

  function flatten(data, parentId = 'I') {
    return data.reduce((r, { children, name }) => {
      r.push({ name, parentId });
      if (children) r.push(...flatten(children, name));
      return r;
    }, []);
  }

  const getPathOptions = () => {
    const options = [];
    for (let i = 0; i < 54; i += 1) {
      options.push({ label: i, value: String(i) });
    }
    return options;
  };

  const getLevelOptions = () => {
    const options = [];
    options.push({ label: 'a1', value: 'a1' });
    options.push({ label: 'a2', value: 'a2' });
    options.push({ label: 'b1', value: 'b1' });
    options.push({ label: 'b2', value: 'b2' });
    options.push({ label: 'b3', value: 'b3' });
    options.push({ label: 'b4', value: 'b4' });
    options.push({ label: 'b5', value: 'b5' });
    options.push({ label: 'b6', value: 'b6' });
    options.push({ label: 'c1', value: 'c1' });
    options.push({ label: 'c2', value: 'c2' });
    options.push({ label: 'c3', value: 'c3' });
    options.push({ label: 'c4', value: 'c4' });
    options.push({ label: 'c5', value: 'c5' });
    options.push({ label: 'c6', value: 'c6' });
    options.push({ label: 'c7', value: 'c7' });
    options.push({ label: 'c8', value: 'c8' });
    options.push({ label: 'c9', value: 'c9' });
    options.push({ label: 'c10', value: 'c10' });
    options.push({ label: 'c11', value: 'c11' });
    options.push({ label: 'c12', value: 'c12' });
    options.push({ label: 'c13', value: 'c13' });
    options.push({ label: 'c14', value: 'c14' });
    options.push({ label: 'c15', value: 'c15' });
    options.push({ label: 'c16', value: 'c16' });
    options.push({ label: 'c17', value: 'c17' });
    options.push({ label: 'c18', value: 'c18' });
    return options;
  };

  const handlePathChange = (type, pos) => (value) => {
    const entryAndDestClone = cloneDeep(entryAndDest);
    entryAndDestClone[type][pos] = value;
    setEntryAndDest(entryAndDestClone);
  };

  const straightPathFunc = (linkDatum, orientation) => {
    const { source, target } = linkDatum;
    return orientation === 'horizontal'
      ? `M${source.y},${source.x}L${target.y},${target.x}`
      : `M${source.x},${source.y}L${target.x},${target.y}`;
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

  const compareSchemes = () => {
    calculatePIX();
    calculateLIX();
  };

  const calculateLIX = () => {
    const uniqBroadcastItems = uniq([...cachingInput.broadcast]);
    const number_of_cols = cachingInput.broadcast.length;
    let probabilityTable = new Array(uniqBroadcastItems.length).fill(0);
    probabilityTable = probabilityTable.map((item, ind) => ({
      name: uniqBroadcastItems[ind],
      values: new Array(number_of_cols).fill(0),
    }));
    const finalProbability = probabilityTable.map((row) => {
      const newRow = { ...row };
      let timeLastAccessed = 0;
      let itemLastProbability = 0;
      const c = 1 / 2;
      for (let i = 1; i <= number_of_cols; i += 1) {
        const t = i;
        const ti = i === 1 ? 0 : timeLastAccessed;
        const pi = i === 1 ? 0 : itemLastProbability;
        const currentItem = cachingInput.broadcast[i - 1];
        const part1 = c / (t - ti);
        const part2 = (1 - c) * pi;
        let probability = part1 + part2;
        if (currentItem === newRow.name) {
          timeLastAccessed = i;
          itemLastProbability = probability;
        } else {
          probability = itemLastProbability;
        }
        newRow.values[i] = Number(probability).toFixed(2);
        // console.log(
        //   `${row.name} => currentItem = ${currentItem}, t = ${t}, ti = ${ti}, pi = ${pi}, part1 = ${part1}, part2 = ${part2} probability = ${probability}`
        // );
      }
      // newRow.values = newRow.values.slice(1);
      return newRow;
    });
    const probabilityHashMap = {};
    for (let i = 0; i < uniqBroadcastItems.length; i += 1) {
      probabilityHashMap[finalProbability[i].name] = max(
        finalProbability[i].values
      );
    }
    const frequenciesHashMap = getPageFrequencies(cachingInput.broadcast);
    const lixHashMap = {};
    Object.keys(probabilityHashMap).map((page) => {
      const lix = probabilityHashMap[page] / frequenciesHashMap[page];
      lixHashMap[page] = Number(lix).toFixed(2);
    });
    console.log({
      number_of_cols,
      probabilityTable,
      finalProbability,
      probabilityHashMap,
      lixHashMap,
    });
    setLixProbHashMap(probabilityHashMap);
    setLix(lixHashMap);
    const { steps, pixLogs } = calculateSteps(lixHashMap);
    pixLogs.push(`
    -----------------------------------------`);
    pixLogs.push(`Total Steps: ${steps}`);
    pixLogs.push(`-----------------------------------------`);
    setLixSteps(pixLogs);
    // console.log(`LIX total steps: ${steps}, ${pixLogs}`);
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
      pixHashMap[page] = Number(pix).toFixed(2);
    });
    setPix(pixHashMap);
    const { steps, pixLogs } = calculateSteps(pixHashMap);
    pixLogs.push(`
    -----------------------------------------`);
    pixLogs.push(`Total Steps: ${steps}`);
    pixLogs.push(`-----------------------------------------`);
    setPixSteps(pixLogs);
    // console.log(`PIX total steps: ${steps}, ${pixLogs}`);
  };

  const calculateSteps = (
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
      return calculateSteps(
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
      return calculateSteps(
        pixHashMap,
        clientReq,
        broadcastIndex,
        steps,
        cache,
        pixLogs
      );
    }
  };

  const getEntirePath = ({
    shouldSetPath = true,
    entryPath = entryAndDest.entire.dest.value,
  }) => {
    const traversePath = (dest, path) => {
      const index = findIndex(flattenedNodes, { name: dest });
      const currentNode = flattenedNodes[index];
      // console.log({ currentNode, dest });
      if (currentNode && currentNode.name === currentNode.parentId) {
        path.push(currentNode.name);
        return path;
      } else {
        path.push(currentNode.name);
      }
      return traversePath(currentNode.parentId, path);
    };
    const path = traversePath(entryPath, []);
    if (shouldSetPath) setEntirePath(path.reverse().join(' -> '));
    return path;
    // console.log('Entire Path: ', path.reverse().join(' -> '));
  };

  const getChildrenByParent = (parentId) =>
    flattenedNodes.filter((node) => node.parentId === parentId);

  const getLevelHash = (node) => {
    const levelByValue = {
      Level1: ['a1', 'a2'],
      Level2: ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'],
      Level3: [
        'c1',
        'c2',
        'c3',
        'c4',
        'c5',
        'c6',
        'c7',
        'c8',
        'c9',
        'c10',
        'c11',
        'c12',
        'c13',
        'c14',
        'c15',
        'c16',
        'c17',
        'c18',
      ],
    };
    const valueByLevel = {};
    getLevelOptions().map((level) => {
      let currentLevel;
      if (level.value.includes('a')) currentLevel = 'Level1';
      if (level.value.includes('b')) currentLevel = 'Level2';
      if (level.value.includes('c')) currentLevel = 'Level3';
      valueByLevel[level.value] = currentLevel;
    });
    return { levelByValue, valueByLevel };
  };

  const getPartialPath = () => {
    const { levelByValue, valueByLevel } = getLevelHash(level.value);
    const replicationLevel = levelByValue[valueByLevel[level.value]];
    let children = [];
    replicationLevel.map((level) => {
      const levelChildren = getChildrenByParent(level);
      children = [...children, ...levelChildren];
    });
    children = children.map((child) => ({
      ...child,
      children: getChildrenByParent(child.name),
    }));
    for (let i = 0; i < children.length; i += 1) {
      let child = children[i];
      child.data = [];
      child.children = child.children.map((grandChild) => {
        const greatGrandChildren = getChildrenByParent(grandChild.name);
        for (let i = 0; i < greatGrandChildren.length; i += 1) {
          const data = greatGrandChildren[i];
          child.data.push(data.name);
        }
        return grandChild.name;
      });
    }
    children = children.map((child) => {
      const temp = [
        child.parentId,
        child.name,
        ...child.children,
        ...child.data,
      ];
      return temp;
    });
    const controlIndexes = [];
    let startRange = 0;
    for (let i = 0; i < children.length; i += 1) {
      const row = children[i];
      const localControlIndex = i;
      const globalControlIndex = Number(row[0].slice(1));
      const endRange = Number(row[row.length - 1]);
      controlIndexes.push({
        globalControlIndex,
        localControlIndex,
        path: row,
        startRange,
        endRange,
      });
      startRange = endRange + 1;
    }
    const uniqueGlobalIndexes = uniqBy(controlIndexes, 'globalControlIndex');
    const globalIndexes = {};
    uniqueGlobalIndexes.map((ind) => {
      const ranges = controlIndexes.filter(
        (i) => ind.globalControlIndex === i.globalControlIndex
      );
      globalIndexes[ind.globalControlIndex] = {
        startRange: ranges[0].startRange,
        endRange: ranges[ranges.length - 1].endRange,
      };
    });
    const shouldSetPath = false;
    const entryPath = entryAndDest.partial.dest.value;
    let path = getEntirePath({ shouldSetPath, entryPath });
    path = path.reverse();
    const destValue = Number(entryAndDest.partial.dest.value);
    const I = controlIndexes.filter(
      (ind) => destValue >= ind.startRange && destValue <= ind.endRange
    );
    path[0] = `I${I[0].globalControlIndex}`;
    setPartialPath(path.join(' -> '));
    setControlIndexes(controlIndexes);
    setGlobalIndexes(globalIndexes);
    console.log({ controlIndexes, globalIndexes, I, path });
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
                  <Button primary onClick={compareSchemes}>
                    Compare Caching Schemes
                  </Button>
                </div>
              </div>
            </>
          )}
          {mode.value === 'INDEXING' && (
            <>
              <div>
                <h4>Entire Path</h4>
                <div className="select-cache">
                  <label>Enters at</label>
                  <Select
                    value={entryAndDest.entire.entry}
                    onChange={handlePathChange('entire', 'entry')}
                    options={getPathOptions()}
                  />
                </div>
                <div className="select-cache">
                  <label>Destination</label>
                  <Select
                    value={entryAndDest.entire.dest}
                    onChange={handlePathChange('entire', 'dest')}
                    options={getPathOptions()}
                  />
                </div>
                <div className="select-cache cache-buttons">
                  <Button primary onClick={getEntirePath}>
                    Get Entire Path
                  </Button>
                </div>
              </div>
              <div>
                <h4>Partial Path</h4>
                <div className="select-cache">
                  <label>Enters at</label>
                  <Select
                    value={entryAndDest.partial.entry}
                    onChange={handlePathChange('partial', 'entry')}
                    options={getPathOptions()}
                  />
                </div>
                <div className="select-cache">
                  <label>Destination</label>
                  <Select
                    value={entryAndDest.partial.dest}
                    onChange={handlePathChange('partial', 'dest')}
                    options={getPathOptions()}
                  />
                </div>
                <div className="select-cache">
                  <label>Level</label>
                  <Select
                    value={level}
                    onChange={setLevel}
                    options={getLevelOptions()}
                  />
                </div>
                <div className="select-cache cache-buttons">
                  <Button secondary onClick={getPartialPath}>
                    Get Partial Path
                  </Button>
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
                  borderBottom: '1px solid silver',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    width: '50%',
                    borderRight: '1px solid silver',
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
                    display: 'flex',
                    justifyContent: 'space-around',
                    width: '50%',
                  }}
                >
                  <div>
                    <h4>Access Probabilities (LIX)</h4>
                    {Object.keys(lixProbHashMap).length ? (
                      <ul>
                        {Object.keys(lixProbHashMap).map((item) => (
                          <li>
                            {item}: {lixProbHashMap[item]}
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
                    <h4>LIX Values</h4>
                    {Object.keys(lix).length ? (
                      <ul>
                        {Object.keys(lix).map((item) => (
                          <li>
                            {item}: {lix[item]}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
              </div>
              <div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <div
                    style={{
                      borderRight: '1px solid silver',
                      width: '30%',
                    }}
                  >
                    <h3
                      style={{
                        borderBottom: '1px solid silver',
                        paddingBottom: '5px',
                      }}
                    >
                      PIX Scheme Steps
                    </h3>
                    <ScrollArea
                      style={{ height: '60vh' }}
                      suppressScrollX={false}
                    >
                      {pixSteps.map((step) => (
                        <div>{step}</div>
                      ))}
                    </ScrollArea>
                  </div>
                  <div
                    style={{
                      borderRight: '1px solid silver',
                      width: '30%',
                    }}
                  >
                    <h3
                      style={{
                        borderBottom: '1px solid silver',
                        paddingBottom: '5px',
                      }}
                    >
                      LIX Scheme Steps
                    </h3>
                    <ScrollArea
                      style={{ height: '60vh' }}
                      suppressScrollX={false}
                    >
                      {lixSteps.map((step) => (
                        <div>{step}</div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {mode.value === 'INDEXING' && (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', width: '100%' }}>
              <div
                id="treeWrapper"
                style={{ marginLeft: '15px', width: '100%', height: '27em' }}
              >
                <h2>Indexing</h2>
                <Tree
                  data={nodes}
                  orientation="vertical"
                  separation={{ nonSiblings: 1, siblings: 1 }}
                  rootNodeClassName="root-node"
                  branchNodeClassName="branch-node"
                  leafNodeClassName="leaf-node"
                  pathClassFunc={getDynamicPathClass}
                  renderCustomNodeElement={renderRectSvgNode}
                />
                {entirePath !== '' && (
                  <div style={{ width: '80%', margin: '0 auto' }}>
                    <strong>Entire Path:</strong> {entirePath}
                  </div>
                )}
                {partialPath !== '' && (
                  <div style={{ width: '80%', margin: '0 auto' }}>
                    <strong>Partial Path:</strong> {partialPath}
                  </div>
                )}
                {allControlIndexes.length > 0 && (
                  <div
                    style={{
                      width: '80%',
                      margin: '10px auto',
                    }}
                  >
                    <div>
                      <ScrollArea
                        style={{
                          height: '30vh',
                          display: 'flex',
                          justifyContent: 'space-around',
                        }}
                        suppressScrollX={false}
                      >
                        <div>
                          {allControlIndexes.map((ind) => (
                            <div
                              style={{
                                border: '1px solid silver',
                                padding: 7,
                                margin: 10,
                              }}
                            >{`I${ind.globalControlIndex} | ${ind.path.join(
                              ' | '
                            )} ----- Range: ${ind.startRange} - ${
                              ind.endRange
                            }`}</div>
                          ))}
                        </div>
                        <div>
                          {Object.keys(allGlobalIndexes).length ? (
                            <ul>
                              {Object.keys(allGlobalIndexes).map((item) => (
                                <li>
                                  {item}:{' '}
                                  {`${allGlobalIndexes[item].startRange} - ${allGlobalIndexes[item].endRange}`}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            ''
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
