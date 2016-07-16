import {run} from '@cycle/xstream-run';
import {makeDOMDriver} from '@cycle/dom';
import {isolate} from '@cycle/isolate';
import {restart, restartable} from 'cycle-restart';
import Recall from './app/recall';

const drivers = {
  DOM: makeDOMDriver('#root')
};

run(Recall, drivers);
