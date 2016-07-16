import xs from 'xstream'
import {div, input, h1, button} from '@cycle/dom'
import delay from 'xstream/extra/delay';
import Immutable from 'immutable';

const size = 5;
const numToSelect = 9;

const intent = sources$ => ({
    newGame$:
      sources$.DOM
        .select('.recall-restart-btn')
        .events('click')
        .mapTo(true)
        .startWith(true),

    selectTile$:
      sources$.DOM
        .select('.recall-grid-tile')
        .events('click')
        .map(ev => {
          return {
            row: ev.target.dataset.row,
            col: ev.target.dataset.col
          };
        })
  })

function createInitState() {
  var initState = Immutable.Map({
    solBoard: generateSolBoard(makeBoard(size, false), numToSelect),
    currBoard: makeBoard(size, false),
    numSelected: 0,
    gameFinished: false,
    playerWon: false,
    isDisabled: true
  });

  return initState;
}

const model = (actions) => {

  let newGameReducer$ = xs.merge(
    actions.newGame$
      .mapTo((state) => {
        return state.merge(createInitState());
      }),
    actions.newGame$
      .compose(delay(5000))
      .mapTo((state) => state.set('isDisabled', false))
  );

  let selectTileReducer$ = actions.selectTile$
    .map((selectedTile) => {
      return function (state) {
        let updated;
        if (state.get('gameFinished')) return state;

        state.get('currBoard')[selectedTile.row][selectedTile.col] = true;

        let nextNumSelected = state.get('numSelected') + 1
        updated = state.set('numSelected', nextNumSelected);

        if (nextNumSelected === numToSelect) {
          updated = updated.set('gameFinished', true)
                          .set('isDisabled', true);
          if(isCorrectSelection(updated.get('currBoard'), updated.get('solBoard'), 5)) {
            updated = updated.set('playerWon', true);
          }
        }

        return updated;
      }
    })

  let reducer$ = xs.merge(
    newGameReducer$,
    selectTileReducer$
  );

  let initState = createInitState();

  const state$ = reducer$.fold((next, reducer) => reducer(next), initState);
  return state$;
}

function renderTileView(row, col, isSelected) {
  return div('.recall-grid-tile', {
    class: { 'is-selected': isSelected },
    attrs: { 'data-row': row, 'data-col': col }
  }, [])
}

const view = (state$) =>
  state$.map(state => {
    let stateJS = state.toJS();
    let board = stateJS.isDisabled ? stateJS.solBoard : stateJS.currBoard;
    let vtree =
      div('.recall', [stateJS.gameFinished && stateJS.playerWon ?
        div('.recall-message.recall-win-message', [
          'You win!',
          button('.recall-restart-btn',[
            'Do it again!'
          ]),
        ]) : '',
        stateJS.gameFinished && !stateJS.playerWon ? div('.recall-message.recall-win-message', [
          'Whomp... Sorry',
          button('.recall-restart-btn',[
            'Try again...'
          ])
        ]) : '',
        div('.recall-grid', board.map((row, rowIdx) =>
          div('.recall-grid-row', row.map((selected, colIdx) => {
            return renderTileView(rowIdx, colIdx, selected)
          }))
        ))
      ]);

    return vtree;
  });

function isCorrectSelection(board, solBoard, size) {
  var row, col, num = size;
  for(row = 0; row < num; row++) {
    for(col = 0; col < num; col++) {
      if(solBoard[row][col] !== board[row][col]) return false;
    }
  }

  return true;
}

function makeBoard(size, value) {
 var arr = [], row, col;
 for(row = 0; row < size; row++) {
   arr[row] = [];
   for(col = 0; col < size; col++) {
     arr[row][col] = value;
   }
 }

 return arr;
}

function generateSolBoard(board, numToSelect) {
  var matrix = board,
      numSelected = 0,
      randRow = 0,
      randCol = 0;

  while(numSelected < numToSelect) {
    randRow = randomWithinRange(0, matrix.length);
    randCol = randomWithinRange(0, matrix[0].length);

    if(!matrix[randRow][randCol]) {
      matrix[randRow][randCol] = true;
      numSelected += 1;
    }
  }

  return matrix;
}

function randomWithinRange(min, range) {
  return min + Math.floor(Math.random() * range);
}


export default sources => ({
  DOM: view(model(intent(sources)))
})
