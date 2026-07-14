const form = document.getElementById("deck-form");
const downloadButton = document.getElementById("downloadButton");

let currentEstimate = null;

function numberValue(id) {
  return Number(document.getElementById(id).value);
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value);
}

function whole(value) {
  return Math.ceil(value);
}

function calculateDeck() {
  const deckLength = numberValue("deckLength");
  const deckWidth = numberValue("deckWidth");
  const boardLength = numberValue("boardLength");
  const boardWidthInches = numberValue("boardWidth");
  const boardGapInches = numberValue("boardGap");
  const joistSpacingInches = numberValue("joistSpacing");
  const waste = numberValue("waste");
  const boardPrice = numberValue("boardPrice");
  const joistPrice = numberValue("joistPrice");
  const screwPrice = numberValue("screwPrice");
  const includeRimJoists = document.getElementById("includeRimJoists").checked;
  const doubleBeam = document.getElementById("doubleBeam").checked;

  if ([deckLength, deckWidth, boardLength, boardWidthInches, joistSpacingInches].some(v => !Number.isFinite(v) || v <= 0)) {
    alert("Please enter valid positive dimensions.");
    return;
  }

  const deckArea = deckLength * deckWidth;
  const moduleWidthFeet = (boardWidthInches + boardGapInches) / 12;

  // Assumes boards run parallel to deck length.
  const boardRows = whole(deckWidth / moduleWidthFeet);
  const linearFeetDecking = boardRows * deckLength;
  const deckBoards = whole((linearFeetDecking / boardLength) * (1 + waste));

  // Joists run across deck width and are spaced along deck length.
  const fieldJoists = whole((deckLength * 12) / joistSpacingInches) + 1;
  const rimJoists = includeRimJoists
    ? whole((2 * deckLength + 2 * deckWidth) / boardLength)
    : 0;

  // Conceptual beam along deck length. Quantity expressed as stock-length boards.
  const beamPlies = doubleBeam ? 2 : 1;
  const beamBoards = whole(deckLength / boardLength) * beamPlies;

  // Conceptual posts at ~6 feet on center, minimum 2.
  const posts = Math.max(2, whole(deckLength / 6) + 1);

  // Two screws at every board/joist crossing, plus waste.
  const screws = whole(boardRows * fieldJoists * 2 * (1 + waste));
  const screwBoxes = whole(screws / 1000);

  const boardCost = deckBoards * boardPrice;
  const joistCost = (fieldJoists + rimJoists) * joistPrice;
  const screwCost = screwBoxes * screwPrice;
  const subtotal = boardCost + joistCost + screwCost;

  currentEstimate = {
    inputs: {
      deckLength,
      deckWidth,
      boardLength,
      boardWidthInches,
      boardGapInches,
      joistSpacingInches,
      wastePercent: waste * 100
    },
    results: {
      deckArea,
      boardRows,
      linearFeetDecking,
      deckBoards,
      fieldJoists,
      rimJoists,
      beamBoards,
      beamPlies,
      posts,
      screws,
      screwBoxes,
      boardCost,
      joistCost,
      screwCost,
      subtotal
    }
  };

  document.getElementById("deckArea").textContent = `${deckArea.toFixed(1)} sq ft`;
  document.getElementById("estimatedCost").textContent = money(subtotal);

  document.getElementById("deckBoards").textContent = deckBoards;
  document.getElementById("deckBoardsDetail").textContent =
    `${boardLength}-ft boards, including ${Math.round(waste * 100)}% waste`;

  document.getElementById("joists").textContent = fieldJoists;
  document.getElementById("joistsDetail").textContent =
    `Spaced ${joistSpacingInches} in on center; joists span the ${deckWidth}-ft direction`;

  document.getElementById("rimJoists").textContent = rimJoists;
  document.getElementById("rimJoistsDetail").textContent =
    includeRimJoists ? `${boardLength}-ft stock boards` : "Not included";

  document.getElementById("beamBoards").textContent = beamBoards;
  document.getElementById("beamBoardsDetail").textContent =
    `${beamPlies === 2 ? "Double" : "Single"} beam using ${boardLength}-ft stock`;

  document.getElementById("posts").textContent = posts;

  document.getElementById("screws").textContent = screws.toLocaleString();
  document.getElementById("screwsDetail").textContent =
    `${screwBoxes} box${screwBoxes === 1 ? "" : "es"} of 1,000`;

  document.getElementById("boardCost").textContent = money(boardCost);
  document.getElementById("joistCost").textContent = money(joistCost);
  document.getElementById("screwCost").textContent = money(screwCost);
  document.getElementById("subtotal").textContent = money(subtotal);
}

function downloadShoppingList() {
  if (!currentEstimate) calculateDeck();
  if (!currentEstimate) return;

  const { inputs, results } = currentEstimate;

  const text = [
    "DECK MATERIAL SHOPPING LIST",
    "===========================",
    "",
    `Deck size: ${inputs.deckLength} ft × ${inputs.deckWidth} ft`,
    `Deck area: ${results.deckArea.toFixed(1)} sq ft`,
    `Waste allowance: ${inputs.wastePercent}%`,
    "",
    "ESTIMATED MATERIALS",
    `- Deck boards: ${results.deckBoards} × ${inputs.boardLength}-ft boards`,
    `- Field joists: ${results.fieldJoists}`,
    `- Rim/band stock boards: ${results.rimJoists}`,
    `- Beam stock boards: ${results.beamBoards}`,
    `- Posts: ${results.posts}`,
    `- Deck screws: ${results.screws.toLocaleString()} (${results.screwBoxes} box(es) of 1,000)`,
    "",
    "ROUGH PRICED SUBTOTAL",
    `- Deck boards: ${money(results.boardCost)}`,
    `- Joists and rim boards: ${money(results.joistCost)}`,
    `- Screws: ${money(results.screwCost)}`,
    `- Subtotal: ${money(results.subtotal)}`,
    "",
    "NOT INCLUDED",
    "Beam lumber pricing, posts, footings, connectors, railing, stairs, tax, delivery, tools, and permit costs.",
    "",
    "IMPORTANT",
    "This is a preliminary planning estimate, not a structural design. Verify spans, loads, footing requirements, ledger attachment, hardware, and local building-code requirements before purchasing or building."
  ].join("\n");

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "deck-shopping-list.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculateDeck();
  drawDeckPreview();
});

downloadButton.addEventListener("click", downloadShoppingList);
document.getElementById("year").textContent = new Date().getFullYear();

function drawDeckPreview() {
  const canvas = document.getElementById("deckCanvas");

  if (!canvas) {
    return;
  }

  const context = canvas.getContext("2d");

  const deckLength = Number(document.getElementById("deckLength").value);
  const deckWidth = Number(document.getElementById("deckWidth").value);

  context.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 60;
  const availableWidth = canvas.width - padding * 2;
  const availableHeight = canvas.height - padding * 2;

  const scale = Math.min(
    availableWidth / deckLength,
    availableHeight / deckWidth
  );

  const drawingWidth = deckLength * scale;
  const drawingHeight = deckWidth * scale;

  const startX = (canvas.width - drawingWidth) / 2;
  const startY = (canvas.height - drawingHeight) / 2;

  context.fillStyle = "#f4ead8";
  context.fillRect(startX, startY, drawingWidth, drawingHeight);

  context.strokeStyle = "#1d4a31";
  context.lineWidth = 5;
  context.strokeRect(startX, startY, drawingWidth, drawingHeight);

  // Draw deck boards running parallel to the deck length
context.strokeStyle = "#c89b63";
context.lineWidth = 2;

const boardWidthInches = Number(
  document.getElementById("boardWidth").value
);

const boardGapInches = Number(
  document.getElementById("boardGap").value
);

const boardModuleInches = boardWidthInches + boardGapInches;
const deckWidthInches = deckWidth * 12;

const previewBoardRows = Math.ceil(
  deckWidthInches / boardModuleInches
);

for (let i = 1; i < previewBoardRows; i++) {
  const y =
    startY +
    (drawingHeight / previewBoardRows) * i;

  context.beginPath();
  context.moveTo(startX, y);
  context.lineTo(startX + drawingWidth, y);
  context.stroke();
}


// Draw joists perpendicular to the deck boards
context.strokeStyle = "rgba(50, 75, 60, 0.75)";
context.lineWidth = 4;

const joistSpacingInches = Number(
  document.getElementById("joistSpacing").value
);

const deckLengthInches = deckLength * 12;

const previewJoistCount =
  Math.floor(deckLengthInches / joistSpacingInches) + 1;

for (let i = 0; i < previewJoistCount; i++) {
  const x =
    startX +
    (drawingWidth / Math.max(previewJoistCount - 1, 1)) * i;

  context.beginPath();
  context.moveTo(x, startY);
  context.lineTo(x, startY + drawingHeight);
  context.stroke();
}


// Draw a conceptual support beam parallel to the deck boards
const beamY = startY + drawingHeight * 0.72;

context.strokeStyle = "#7a4f2c";
context.lineWidth = 10;

context.beginPath();
context.moveTo(startX, beamY);
context.lineTo(startX + drawingWidth, beamY);
context.stroke();


// Draw conceptual support posts along the beam
const previewPostCount = Math.max(
  2,
  Math.ceil(deckLength / 6) + 1
);

context.fillStyle = "#1f2b23";

for (let i = 0; i < previewPostCount; i++) {
  const x =
    startX +
    (drawingWidth / Math.max(previewPostCount - 1, 1)) * i;

  context.beginPath();
  context.arc(x, beamY, 10, 0, Math.PI * 2);
  context.fill();
}

  context.fillStyle = "#1f2b23";
  context.font = "bold 24px sans-serif";
  context.textAlign = "center";

  context.fillText(
    `${deckLength} ft`,
    startX + drawingWidth / 2,
    startY - 18
  );

  context.save();
  context.translate(startX - 24, startY + drawingHeight / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(`${deckWidth} ft`, 0, 0);
  context.restore();
}

calculateDeck();
drawDeckPreview();
