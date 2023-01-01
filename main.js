// 函式區 ///////////////////////////////////////////////////////////////////////////////////////
// 取得目前棋盤上的空格
function getEmptyPositions() {
  // 這邊也可以寫成：
  // return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
  //   position => !(circlePositions.includes(position) || crossPosition.includes(position))
  // );

  // 取得被任何棋子佔領的位置陣列
  const allOccupiedPositions = circlePositions.concat(crossPositions);

  // 把沒有重複的取出來，即為尚未被畫過的空格
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
    (position) => !allOccupiedPositions.includes(position)
  );
}

// 取得當前能下棋的位置中，最有價值的位置
function getMostValuablePosition() {
  const emptyPositions = getEmptyPositions();
  const defendPositions = []; // 思考看看，為什麼要宣告這一個空陣列

  for (const hypothesisPosition of emptyPositions) {
    // 因為 JavaScript 變數記錄的是陣列的「記憶體位址」，
    // 在函式裡面對陣列做「push」、「pop」等操作，都會影響到函式外面的資料，
    // 為了不要影響到函式外的資料，我們在這裡用 Array.from 把資料複製一份到新的變數。

    const copiedCrossPositions = Array.from(crossPositions);
    const copiedCirclePositions = Array.from(circlePositions);

    // copiedCrossPositions 與 crossPositions 記憶體位置不同，
    // 操作它不會影響到 crossPositions，
    // 而且因為 constant 的 block scope 特性，
    // 離開這個 for 迴圈之後，copiedCrossPositions 就會被記憶體回收，
    // 不用擔心會佔用多餘記憶體。

    copiedCrossPositions.push(hypothesisPosition);
    copiedCirclePositions.push(hypothesisPosition);

    // 第一優先順序：判斷電腦下這個位置是否會獲勝？
    // 如果會的話，直接 return 這個位置，函式也直接結束
    if (isPlayerWin(copiedCrossPositions)) {
      return hypothesisPosition;
    }

    // 第二優先順序：判斷玩家下這個位置是否會獲勝？
    // 如果會的話，先記下來
    if (isPlayerWin(copiedCirclePositions)) {
      defendPositions.push(hypothesisPosition);
    }
  }

  // 當程式進行到這邊，第一優先順序的狀況已經不可能出現
  // 因此我們檢查第二優先順序的「不下這一步就輸」是否存在
  // 若有，就回傳其中一個位置
  if (defendPositions.length) {
    return defendPositions[0];
  }

  // 次要策略，輪到你囉！
  // TODO: 如果中間還可以下棋的話，就下中間
  if (emptyPositions.includes(5)) {
    return 5;
  }

  // TODO: 隨機下一個位置
  return emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
}

function computerMove() {
  const drawingPosition = getMostValuablePosition();
  draw(drawingPosition, "cross");
  crossPositions.push(drawingPosition);
  checkWinningCondition("cross");
}

function draw(position, shape) {
  // 限定形狀只能傳入 "circle" 或 "cross"
  if (shape !== "circle" && shape !== "cross") {
    throw "Unknown drawing shape, must be one of: circle, cross";
  }

  const cell = document.querySelector(
    `#app table tr td[data-index='${position}']`
  );
  cell.innerHTML = `<div class='${shape}'></div>`;
}

// 方便計算 row & column 位置的 helper
// 例如 row(3) 就是 7、8、9 格
function row(number) {
  return [3 * (number - 1) + 1, 3 * (number - 1) + 2, 3 * (number - 1) + 3];
}

function column(number) {
  return [number, number + 3, number + 6];
}

// 遊戲勝利的八條連線
const checkingLines = [
  row(1),
  row(2),
  row(3),
  column(1),
  column(2),
  column(3),
  [1, 5, 9],
  [3, 5, 7],
];

// 判斷此位置陣列是否包含勝利連線
// 讓要檢查的陣列去一一比對是否包含了某一條line的[0]、[1]、[2]，如果都有包含到，代表此陣列有連成一條線
function isPlayerWin(checkingPositions) {
  for (const line of checkingLines) {
    // Array.every 便利地取代了 && (and operator)
    // ref: https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Array/every

    // 如果不用 Array.every 的話，可以這樣寫：
    // if (checkingPositions.includes(line[0]) &&
    //     checkingPositions.includes(line[1]) &&
    //     checkingPositions.includes(line[2]) &&) {
    //   return true;
    // }
    if (line.every((position) => checkingPositions.includes(position))) {
      return true;
    }
  }

  return false;
}

function checkWinningCondition(player) {
  // 取得要判斷的玩家的位置陣列
  // 這邊的資料也可以從參數傳入，變成 checkWinningCondition(position, player)
  // 因為我們沒有要操作這個陣列，所以也不需要使用 Array.from 了
  let position = circlePositions;
  if (player === "cross") {
    position = crossPositions;
  }

  if (isPlayerWin(position)) {
    gameoverFlag = true;
    removeClickListeners();

    return alert(`${player} player won!`);
  }

  if (getEmptyPositions().length === 0) {
    gameoverFlag = true;

    return alert("Tied!");
  }

  clickingThrottle = false;
}

// 將綁定在 td 上面的監聽器移除，取消點擊行為
function removeClickListeners() {
  document.querySelectorAll("#app table tr td").forEach((cell) => {
    cell.removeEventListener("click", onCellClicked);
  });
}

// 事件監聽器若聽到 click 就會觸發這個 function
function onCellClicked(event) {
  // 若點擊控制閥打開，就直接 return，點擊不會有反應，防止玩家一次點好幾格
  if (clickingThrottle) return;

  const position = Number(event.target.dataset.index);
  if (!position) return;

  draw(position, "circle");
  circlePositions.push(position);
  // 此時控制閥打開，不讓玩家亂點
  clickingThrottle = true;

  // 為了不要讓結果太快出現（也讓電腦有一點「思考時間」 XD），
  // 設計了 0.1 秒的等待時間，
  // 在這 0.1 秒內，玩家不能下棋
  setTimeout(() => {
    // 確認勝利條件時若遊戲尚未結束，則控制閥會關閉，接著電腦畫叉
    // 再換玩家時，因為控制閥已關閉，所以可以畫圈
    checkWinningCondition("circle");

    if (!gameoverFlag) {
      computerMove();
    }
  }, 100);
}

// 資料區 /////////////////////////////////////////////////////////////////////////////////////////
const circlePositions = [];
const crossPositions = [];

// 遊戲開始 ///////////////////////////////////////////////////////////////////////////////////////
// 點擊控制閥，只有在 false 時玩家才能畫圈，所以可以控制流程讓電腦畫完玩家才能畫
// 沒控管就會發生一次連按好幾格都能打圈的狀況
// 不過實際上應該只能按到 2 格，因為你按的同時電腦也會下棋，只是不會馬上出現
// 所以有可能連按到第 3 格時其實電腦已經在該格畫了，或是電腦已經畫其他格贏了
let clickingThrottle = false;
let gameoverFlag = false;

// 設置事件監聽器，只要點擊九宮格就觸發 onCellClicked 進而呼叫一堆函式
document.querySelectorAll("#app table tr td").forEach((cell) => {
  cell.addEventListener("click", onCellClicked);
});
