import React, {useCallback, useRef} from 'react';
import './App.css';
import {Drawer} from "./libs/drawer";

function App() {
    const drawerInstance = useRef<Drawer>(new Drawer());

    const initRef = useCallback((el: HTMLDivElement) => {
        console.log(el);
        drawerInstance.current.init(el);
    }, [])

  return (
    <div className="root">
      <div ref={initRef} className={'drawer'} id="content"/>
    </div>
  );
}

export default App;
