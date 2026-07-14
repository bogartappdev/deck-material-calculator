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
});

downloadButton.addEventListener("click", downloadShoppingList);
document.getElementById("year").textContent = new Date().getFullYear();

calculateDeck();
