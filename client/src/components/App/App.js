import React from 'react';
import {ConfigContext} from '../../app/Context';
import LandExplorer from '../LandExplorer/LandExplorer';
import ExpressionExplorer from '../ExpressionExplorer/ExpressionExplorer';
import DatabaseLocator from '../DatabaseLocator/DatabaseLocator';
import './App.css';

function App() {
    return (
        <ConfigContext>
            <div className="App">
                <header className="App-header">
                    <div className="p-3">
                        <DatabaseLocator/>
                    </div>
                </header>
                <aside className="App-sidebar">
                    <div className="p-3">
                    <LandExplorer/>
                    </div>
                </aside>
                <section className="App-view">
                    <div className="p-3">
                        <ExpressionExplorer/>
                    </div>
                </section>
            </div>
        </ConfigContext>
    );
}

export default App;