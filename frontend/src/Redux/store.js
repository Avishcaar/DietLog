import { applyMiddleware, combineReducers, legacy_createStore } from 'redux';
import {reducer as AuthReducer} from "./Login/reducer"
import  { thunk } from 'redux-thunk';
const rootReducer = combineReducers({
    AuthReducer
});

const store = legacy_createStore(rootReducer, applyMiddleware(thunk));

export default store;