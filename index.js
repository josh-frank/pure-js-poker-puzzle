//                    A,  2,  3,  4,  5,  6,  7,  8,  9, 10,  J,  Q,  K,  A
//    clubs = [ nil, 49,  1,  5,  9, 13, 17, 21, 25, 29, 33, 37, 41, 45, 49 ]
// diamonds = [ nil, 50,  2,  6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50 ]
//   hearts = [ nil, 51,  3,  7, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51 ]
//   spades = [ nil, 52,  4,  8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52 ]

const fullDeck = [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52 ];
const rankNames = [ null, null, "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King", "Ace" ];
const suitNames = [ "Clubs", "Diamonds", "Hearts", "Spades" ];

const handNames = [ "No hand", "One pair", "Jacks or better", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush", "Royal flush" ]

function countBits( bit ) {
   let counter =  bit - ( ( bit >> 1 ) & 033333333333 ) - ( ( bit >> 2 ) & 011111111111 );
   counter = ( ( counter + ( counter >> 3 ) ) & 030707070707 ) % 63;
   return counter;
}

function suit( card ) { return Math.floor( ( card - 1 ) % 4 ); }

function rank( card ) { return Math.floor( ( ( card - 1 ) / 4 ) + 2 ); }

function cardName( card ) { return `${ rankNames[ rank( card ) ] } of ${ suitNames[ suit( card ) ] }` }

function shuffledDeck() {
    const deck = [ ...fullDeck ];
    for ( let i = deck.length - 1; i > 0; i-- ) {
        const j = Math.floor( Math.random() * ( i + 1 ) );
        [ deck[ i ], deck[ j ] ] = [ deck[ j ], deck[ i ] ];
    }
    return deck;
}

function value( hand ) {
    const countByPair = [ 0, 0, 0, 0 ];
    const countBySuit = [ 0, 0, 0, 0 ];
    let score = 0;
    hand.forEach( card => {
        countBySuit[ suit( card ) ] |= ( 1 << rank( card ) );
        let total = 0;
        countBySuit.forEach( suit => { total += ( suit >> rank( card ) ) & 1; } );
        if ( total === 4 ) { score = 8; }
        countByPair[ total ] ^= 1 << rank( card );
        countByPair[ total - 1 ] ^= 1 << rank( card );
    } );
    if ( !!score ) { return score; }
    countBySuit.forEach( suit => {
        if ( suit >= 31744 ) { score = 10; }
        while ( suit != 0 && suit % 2 === 0 ) { suit >>= 1; }
        if ( ( suit % 32 == 31 || ( suit % 32 == 15 && suit > 4096 ) ) && !score ) { score = 9; }
        if ( countBits( suit ) >= 5 && !score ) { score = 6; }
    } );
    if ( !!score ) { return score; }
    while ( countByPair[ 0 ] % 2 === 0 ) { countByPair[ 0 ] >>= 1; }
    if ( countByPair[ 0 ] % 32 == 31 || ( countByPair[ 0 ] % 32 == 15 && countByPair[ 0 ] > 4096 ) ) { score = 5; }
    else if ( ( countBits( countByPair[ 2 ] ) > 0 && countBits( countByPair[ 3 ] ) > 0 ) || countBits( countByPair[ 3 ] ) > 1 ) { score = 7; }
    else if ( countBits( countByPair[ 3 ] ) > 0 ) { score = 4; }
    else if ( countBits( countByPair[ 2 ] ) > 1 ) { score = 3; }
    else if ( countByPair[ 2 ] >= 2048 ) { score = 2; }
    else if ( countBits( countByPair[ 2 ] ) > 0 ) { score = 1; }
    else { score = 0; }
    return score;
}

function sortDescending( x, y ) { return y - x; }

// coordinates = [ row, column ]
function adjacentSquares( coordinates, board ) {
    const horizontal = [ coordinates[ 0 ] - 1, coordinates[ 0 ], coordinates[ 0 ] + 1 ];
    const vertical = [ coordinates[ 1 ] - 1, coordinates[ 1 ], coordinates[ 1 ] + 1 ];
    const cartesianProduct = ( ...horizontal ) => horizontal.reduce( ( horizontal, vertical ) => horizontal.flatMap( product1 => vertical.map( product2 => [ product1, product2 ].flat() ) ) );
    return cartesianProduct( horizontal, vertical ).filter( square => {
        return square[ 0 ] > -1 && square[ 1 ] > -1 && square[ 0 ] < board.length && square[ 1 ] < board[ 0 ].length && !( square[ 0 ] === coordinates[ 0 ] && square[ 1 ] === coordinates[ 1 ] );
    } );
}

function getPossibleHands( board, handLength, currentCoordinates, handSoFar, handList ) {
    if ( handSoFar.length === handLength ) {
        let sortedHand = handSoFar.sort( sortDescending ).toString();
        if ( handList.indexOf( sortedHand ) < 0 ) { handList.push( sortedHand ); }
    } else {
        let nextSquares = adjacentSquares( currentCoordinates, board );
        for ( let nextSquare in nextSquares ) {
            let thisSquare = board[ currentCoordinates[ 0 ] ][ currentCoordinates[ 1 ] ];
            if ( handSoFar.indexOf( thisSquare ) < 0 ) { getPossibleHands( board, handLength, nextSquares[ nextSquare ], [ ...handSoFar, thisSquare ], handList ); }
        }
    }
}

function allPossibleHands( board, handLength ) {
    let handList = [];
    for ( let row = 0; row < board.length; row++ ) { for ( let column = 0; column < board[ 0 ].length; column++ ) {
        getPossibleHands( board, handLength, [ row, column ], [], handList );
    } }
    return Object.fromEntries( handList.map( ( hand ) => { return [ hand, value( hand.split( "," ).map( ( card ) => { return parseInt( card ); } ) ) ]; } ) );
}

function bestHand( board, handLength ) {
    return Object.entries( allPossibleHands( board, handLength ) ).reduce( ( thisHand, thatHand ) => {
        let thisHandSum = thisHand[ 0 ].split( "," ).map( ( card ) => { return parseInt( card ); } ).reduce( ( thisCard, thatCard ) => thisCard + thatCard, 0 );
        let thatHandSum = thatHand[ 0 ].split( "," ).map( ( card ) => { return parseInt( card ); } ).reduce( ( thisCard, thatCard ) => thisCard + thatCard, 0 );
        if ( thisHand[ 1 ] === thatHand[ 1 ] ) {
            return thisHandSum > thatHandSum ? thisHand : thatHand;
        } else {
            return thisHand[ 1 ] > thatHand[ 1 ] ? thisHand : thatHand;
        }
    } )[ 0 ];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////

const cardImages = [
    [ document.getElementById( "card00-image" ), document.getElementById( "card01-image" ), document.getElementById( "card02-image" ), document.getElementById( "card03-image" ) ],
    [ document.getElementById( "card10-image" ), document.getElementById( "card11-image" ), document.getElementById( "card12-image" ), document.getElementById( "card13-image" ) ],
    [ document.getElementById( "card20-image" ), document.getElementById( "card21-image" ), document.getElementById( "card22-image" ), document.getElementById( "card23-image" ) ],
    [ document.getElementById( "card30-image" ), document.getElementById( "card31-image" ), document.getElementById( "card32-image" ), document.getElementById( "card33-image" ) ] ];
const dealButton = document.getElementById( "deal" );
const guessButton = document.getElementById( "guess" );
const handDisplay = document.getElementById( "hand-display" );
const resultDisplay = document.getElementById( "correct" );

let thisDeck = [];
let thisBoard = [
    [ 0, 0, 0, 0 ],
    [ 0, 0, 0, 0 ],
    [ 0, 0, 0, 0 ],
    [ 0, 0, 0, 0 ] ];
let thisHand = [];

function deal() {
    thisHand = [];
    thisDeck = shuffledDeck();
    for ( const row in [ 0, 1, 2, 3 ] ) { for ( const column in [ 0, 1, 2, 3 ] ) {
        thisBoard[ row ][ column ] = thisDeck.pop();
    } }
    renderCards();
    clearCorrectGuess();
    renderHandDisplay();
    dealButton.disabled = true;
    guessButton.disabled = false;
}

function renderCards() {
    for ( const row in [ 0, 1, 2, 3 ] ) { for ( const column in [ 0, 1, 2, 3 ] ) {
        let card = thisBoard[ row ][ column ];
        cardImages[ row ][ column ].src = `./images/cards/${ card.toString().length == 2 ? card.toString() : "0" + card.toString() }.svg`;
        cardImages[ row ][ column ].dataset.card = card;
        document.getElementById( `card${ [ row ] }${ [ column ] }-image` ).parentElement.setAttribute( "class", "card-cell" );
    } }
}

function renderGuess() {
    let sortedHand = thisHand.sort( sortDescending ).toString();
    if ( thisHand.length !== 5 || Object.keys( allPossibleHands( thisBoard, 5 ) ).indexOf( sortedHand ) < 0 ) {
        resultDisplay.innerText = "INVALID HAND"
    } else {
        if ( bestHand( thisBoard, 5 ) === sortedHand ) {
            resultDisplay.innerText = "CORRECT"
        } else {
            resultDisplay.innerText = "INCORRECT"
        }
        renderCorrectGuess();
        dealButton.disabled = false;
        guessButton.disabled = true;
    }
}

function renderCorrectGuess() {
    let correctGuess = bestHand( thisBoard, 5 ).split( "," ).map( ( card ) => { return parseInt( card ); } );
    for ( const row in [ 0, 1, 2, 3 ] ) { for ( const column in [ 0, 1, 2, 3 ] ) {
        if ( correctGuess.indexOf( thisBoard[ row ][ column ] ) > -1 ) { cardImages[ row ][ column ].classList.add( "correct" ); }
    } }
}

function clearCorrectGuess() {
    resultDisplay.innerText = "";
    for ( const row in [ 0, 1, 2, 3 ] ) { for ( const column in [ 0, 1, 2, 3 ] ) {
        cardImages[ row ][ column ].classList.remove( "correct" );
    } }
}

function addToHand( cardPosition ) {
    let thisCardImage = document.getElementById( `card${ cardPosition }-image` );
    let thisCard = parseInt( thisCardImage.dataset.card );
    let findCardInHand = thisHand.indexOf( thisCard );
    if ( !thisCard ) return;
    if ( findCardInHand < 0 ) {
        thisHand.push( thisCard );
        thisCardImage.parentElement.setAttribute( "class", "card-cell chosen" );
    } else {
        thisHand = thisHand.filter( eachCard => { return eachCard != thisCard; } );
        thisCardImage.parentElement.setAttribute( "class", "card-cell" );
    }
    renderHandDisplay();
}

function clearSelection() {
    thisHand = [];
    [ ...document.getElementsByClassName('card-cell') ].forEach( cardImage => cardImage.setAttribute( "class", "card-cell" ) );
    renderHandDisplay();
}

function renderHandDisplay() {
    handDisplay.innerHTML = "";
    thisHand.forEach( ( card ) => { handDisplay.innerHTML += cardName( card ) + "&#10;"; } );
    // handDisplay.innerHTML += handNames[ value( thisHand ) ];
}

document.addEventListener( "DOMContentLoaded", function() {
    dealButton.addEventListener( "click", deal );
    guessButton.addEventListener( "click", renderGuess )
} );
