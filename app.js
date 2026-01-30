 const STORAGE_KEY = "cheongeum-documents";
 const LAST_OPENED_KEY = "cheongeum-last-opened";
 
const defaultSymbols = [
  { key: "breath-required", label: "✧", meaning: "숨 (필수)" },
  { key: "breath-optional", label: "○", meaning: "숨 (선택)" },
  { key: "accent", label: "★", meaning: "강조" },
  { key: "accent-strong", label: "‼", meaning: "강한 강조" },
  { key: "pitch-up", label: "↑", meaning: "음이 올라감" },
  { key: "pitch-down", label: "↓", meaning: "음이 내려감" },
  { key: "pitch-up-strong", label: "↑↑", meaning: "아주 높은 음" },
  { key: "pitch-down-strong", label: "↓↓", meaning: "아주 낮은 음" },
  { key: "sustain", label: "~~~", meaning: "길게 부르기" },
  { key: "vibrato", label: "🌀", meaning: "떨림" },
  { key: "soft", label: "•", meaning: "작게" },
  { key: "legato", label: "→", meaning: "이어부르기" },
];
 
const dom = {
   titleInput: document.getElementById("title-input"),
   saveStatus: document.getElementById("save-status"),
   lyricsInput: document.getElementById("lyrics-input"),
   applyLyricsBtn: document.getElementById("apply-lyrics-btn"),
   palette: document.getElementById("symbol-palette"),
  legend: document.getElementById("symbol-legend"),
   canvas: document.getElementById("canvas"),
  canvasWrap: document.querySelector(".canvas-wrap"),
  prevPageBtn: document.getElementById("prev-page-btn"),
  nextPageBtn: document.getElementById("next-page-btn"),
  pageIndicator: document.getElementById("page-indicator"),
  openToolsBtn: document.getElementById("open-tools-btn"),
  openInspectorBtn: document.getElementById("open-inspector-btn"),
  drawerOverlay: document.getElementById("drawer-overlay"),
   exportBtn: document.getElementById("export-btn"),
  exportPdfBtn: document.getElementById("export-pdf-btn"),
   inspectorEmpty: document.getElementById("inspector-empty"),
   inspectorBody: document.getElementById("inspector-body"),
   symbolSize: document.getElementById("symbol-size"),
   symbolColor: document.getElementById("symbol-color"),
   deleteSymbolBtn: document.getElementById("delete-symbol-btn"),
 };
 
const LINES_PER_PAGE = 8;

 let documentState = createEmptyDocument();
 let selectedSymbolId = null;
 let dragPayload = null;
let currentPage = 0;
let activeDrawer = null;
 
 function createEmptyDocument() {
   return {
     id: crypto.randomUUID(),
     title: "새 청음 노트",
     lines: [],
     symbols: [],
     createdAt: new Date().toISOString(),
     updatedAt: new Date().toISOString(),
   };
 }
 
 function tokenizeLine(line) {
   const tokens = [];
   let cursor = 0;
   line.split(/\s+/).forEach((word) => {
     if (!word) return;
     const startIndex = line.indexOf(word, cursor);
     const endIndex = startIndex + word.length;
     tokens.push({
       tokenId: crypto.randomUUID(),
       text: word,
       startIndex,
       endIndex,
     });
     cursor = endIndex;
   });
   return tokens;
 }
 
 function applyLyrics(rawText) {
   const lines = rawText
     .split(/\n+/)
     .map((line) => line.trim())
     .filter(Boolean)
     .map((line) => ({
       lineId: crypto.randomUUID(),
       rawText: line,
       tokens: tokenizeLine(line),
     }));
 
   documentState.lines = lines;
   documentState.symbols = [];
   documentState.updatedAt = new Date().toISOString();
   selectedSymbolId = null;
  currentPage = 0;
   render();
   saveDocument();
 }
 
 function renderPalette() {
   dom.palette.innerHTML = "";
   defaultSymbols.forEach((symbol) => {
     const item = document.createElement("div");
     item.className = "palette-item";
     item.textContent = symbol.label;
     item.draggable = true;
     item.dataset.key = symbol.key;
     item.dataset.label = symbol.label;
     item.addEventListener("dragstart", handlePaletteDragStart);
    item.addEventListener("dragend", clearDragLock);
     dom.palette.appendChild(item);
   });
 }
 
function renderLegend() {
  dom.legend.innerHTML = "";
  defaultSymbols.forEach((symbol) => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const icon = document.createElement("div");
    icon.className = "legend-symbol";
    icon.textContent = symbol.label;

    const text = document.createElement("div");
    text.className = "legend-text";
    text.textContent = symbol.meaning;

    item.appendChild(icon);
    item.appendChild(text);
    dom.legend.appendChild(item);
  });
}

function getTotalPages() {
  return Math.max(1, Math.ceil(documentState.lines.length / LINES_PER_PAGE));
}

function renderCanvas() {
  dom.canvas.innerHTML = "";
  const totalPages = getTotalPages();
  currentPage = Math.min(currentPage, totalPages - 1);
  const startIndex = currentPage * LINES_PER_PAGE;
  const pageLines = documentState.lines.slice(
    startIndex,
    startIndex + LINES_PER_PAGE
  );

  pageLines.forEach((line, offsetIndex) => {
    const lineIndex = startIndex + offsetIndex;
    const lineEl = document.createElement("div");
    lineEl.className = "staff-line";
    lineEl.dataset.lineIndex = String(lineIndex);

    const lyricsEl = document.createElement("div");
    lyricsEl.className = "lyrics-line";

    line.tokens.forEach((token, tokenIndex) => {
      const tokenEl = document.createElement("span");
      tokenEl.className = "token";
      tokenEl.textContent = token.text;
      tokenEl.dataset.lineIndex = String(lineIndex);
      tokenEl.dataset.tokenIndex = String(tokenIndex);
      lyricsEl.appendChild(tokenEl);
    });

    const symbolsLayer = document.createElement("div");
    symbolsLayer.className = "symbols-layer";

    lineEl.appendChild(symbolsLayer);
    lineEl.appendChild(lyricsEl);
    dom.canvas.appendChild(lineEl);

    lineEl.addEventListener("dragover", handleCanvasDragOver);
    lineEl.addEventListener("drop", handleCanvasDrop);
  });

  renderSymbols();
  renderPageControls();
}
 
 function renderSymbols() {
   document.querySelectorAll(".symbols-layer").forEach((layer) => {
     layer.innerHTML = "";
   });
 
   documentState.symbols.forEach((symbol) => {
     const lineEl = dom.canvas.querySelector(
       `.staff-line[data-line-index="${symbol.position.lineIndex}"]`
     );
     if (!lineEl) return;
 
     const tokenEl = lineEl.querySelector(
       `.token[data-token-index="${symbol.position.tokenIndex}"]`
     );
     if (!tokenEl) return;
 
     const layer = lineEl.querySelector(".symbols-layer");
     const el = document.createElement("div");
     el.className = "symbol";
     el.textContent = symbol.label;
     el.style.color = symbol.style.color;
     el.style.fontSize = `${symbol.style.size}px`;
     el.dataset.id = symbol.symbolId;
     el.draggable = true;
     el.addEventListener("click", () => selectSymbol(symbol.symbolId));
     el.addEventListener("dragstart", handleSymbolDragStart);
  el.addEventListener("dragend", clearDragLock);
 
     if (symbol.symbolId === selectedSymbolId) {
       el.classList.add("selected");
     }
 
     layer.appendChild(el);
 
     const tokenRect = tokenEl.getBoundingClientRect();
     const lineRect = lineEl.getBoundingClientRect();
     const centerX = tokenRect.left - lineRect.left + tokenRect.width / 2;
     const topY = tokenRect.top - lineRect.top;
     const left = centerX + symbol.position.offsetX;
     const top = topY + symbol.position.offsetY - 6;
     el.style.left = `${left}px`;
     el.style.top = `${top}px`;
   });
 }
 
 function renderInspector() {
   const symbol = documentState.symbols.find(
     (item) => item.symbolId === selectedSymbolId
   );
   if (!symbol) {
     dom.inspectorEmpty.classList.remove("hidden");
     dom.inspectorBody.classList.add("hidden");
     return;
   }
 
   dom.inspectorEmpty.classList.add("hidden");
   dom.inspectorBody.classList.remove("hidden");
   dom.symbolSize.value = String(symbol.style.size);
   dom.symbolColor.value = symbol.style.color;
 }
 
 function render() {
   dom.titleInput.value = documentState.title;
   renderPalette();
  renderLegend();
   renderCanvas();
   renderInspector();
 }

function renderPageControls() {
  const totalPages = getTotalPages();
  dom.pageIndicator.textContent = `${currentPage + 1} / ${totalPages}`;
  dom.prevPageBtn.disabled = currentPage === 0;
  dom.nextPageBtn.disabled = currentPage >= totalPages - 1;
}

function goToPage(nextPage) {
  const totalPages = getTotalPages();
  currentPage = Math.max(0, Math.min(nextPage, totalPages - 1));
  renderCanvas();
  renderInspector();
}
 
 function handlePaletteDragStart(event) {
   dragPayload = {
     type: "palette",
     key: event.currentTarget.dataset.key,
     label: event.currentTarget.dataset.label,
   };
   event.dataTransfer.setData("text/plain", dragPayload.key);
  applyDragLock();
 }
 
 function handleSymbolDragStart(event) {
   const symbolId = event.currentTarget.dataset.id;
   dragPayload = { type: "symbol", symbolId };
   event.dataTransfer.setData("text/plain", symbolId);
  applyDragLock();
 }
 
 function handleCanvasDragOver(event) {
   event.preventDefault();
   const target = event.target.closest(".token");
   document.querySelectorAll(".token.drop-target").forEach((el) => {
     el.classList.remove("drop-target");
   });
   if (target) {
     target.classList.add("drop-target");
   }
 }
 
 function handleCanvasDrop(event) {
   event.preventDefault();
  clearDragLock();
   document.querySelectorAll(".token.drop-target").forEach((el) => {
     el.classList.remove("drop-target");
   });
 
   const lineEl = event.target.closest(".staff-line");
   if (!lineEl || !dragPayload) return;
 
   const lineIndex = Number(lineEl.dataset.lineIndex);
   const tokenEl = event.target.closest(".token") || findClosestToken(lineEl, event);
   if (!tokenEl) return;
 
   const tokenIndex = Number(tokenEl.dataset.tokenIndex);
   const { offsetX, offsetY } = computeOffsets(lineEl, tokenEl, event);
 
   if (dragPayload.type === "palette") {
     const newSymbol = {
       symbolId: crypto.randomUUID(),
       type: "basic",
       key: dragPayload.key,
       label: dragPayload.label,
       position: {
         lineIndex,
         tokenIndex,
         offsetX,
         offsetY,
       },
       style: {
         color: "#1b1c20",
         size: 18,
       },
     };
     documentState.symbols.push(newSymbol);
     selectedSymbolId = newSymbol.symbolId;
   }
 
   if (dragPayload.type === "symbol") {
     const symbol = documentState.symbols.find(
       (item) => item.symbolId === dragPayload.symbolId
     );
     if (symbol) {
       symbol.position.lineIndex = lineIndex;
       symbol.position.tokenIndex = tokenIndex;
       symbol.position.offsetX = offsetX;
       symbol.position.offsetY = offsetY;
       selectedSymbolId = symbol.symbolId;
     }
   }
 
   documentState.updatedAt = new Date().toISOString();
   dragPayload = null;
   renderSymbols();
   renderInspector();
   saveDocument();
 }
 
 function findClosestToken(lineEl, event) {
   const tokens = Array.from(lineEl.querySelectorAll(".token"));
   if (!tokens.length) return null;
   const lineRect = lineEl.getBoundingClientRect();
   const x = event.clientX - lineRect.left;
   let closest = tokens[0];
   let distance = Math.abs(tokens[0].offsetLeft - x);
   tokens.forEach((token) => {
     const d = Math.abs(token.offsetLeft - x);
     if (d < distance) {
       distance = d;
       closest = token;
     }
   });
   return closest;
 }
 
 function computeOffsets(lineEl, tokenEl, event) {
   const lineRect = lineEl.getBoundingClientRect();
   const tokenRect = tokenEl.getBoundingClientRect();
   const dropX = event.clientX - lineRect.left;
   const dropY = event.clientY - lineRect.top;
   const tokenCenterX = tokenRect.left - lineRect.left + tokenRect.width / 2;
   const tokenTopY = tokenRect.top - lineRect.top;
   return {
     offsetX: Math.round(dropX - tokenCenterX),
     offsetY: Math.round(dropY - tokenTopY - 12),
   };
 }
 
 function selectSymbol(symbolId) {
   selectedSymbolId = symbolId;
   renderSymbols();
   renderInspector();
 }
 
 function deleteSelectedSymbol() {
   if (!selectedSymbolId) return;
   documentState.symbols = documentState.symbols.filter(
     (item) => item.symbolId !== selectedSymbolId
   );
   selectedSymbolId = null;
   renderSymbols();
   renderInspector();
   saveDocument();
 }
 
function openDrawer(type) {
  activeDrawer = type;
  document.body.classList.toggle("drawer-tools-open", type === "tools");
  document.body.classList.toggle("drawer-inspector-open", type === "inspector");
  dom.drawerOverlay.classList.remove("hidden");
}

function closeDrawer() {
  activeDrawer = null;
  document.body.classList.remove("drawer-tools-open");
  document.body.classList.remove("drawer-inspector-open");
  dom.drawerOverlay.classList.add("hidden");
}

function applyDragLock() {
  dom.canvasWrap.classList.add("dragging");
}

function clearDragLock() {
  dom.canvasWrap.classList.remove("dragging");
}

 function saveDocument() {
   dom.saveStatus.textContent = "저장 중...";
   documentState.updatedAt = new Date().toISOString();
 
   const docs = loadDocuments();
   const existingIndex = docs.findIndex((doc) => doc.id === documentState.id);
   if (existingIndex >= 0) {
     docs[existingIndex] = documentState;
   } else {
     docs.push(documentState);
   }
 
   localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
   localStorage.setItem(LAST_OPENED_KEY, documentState.id);
   dom.saveStatus.textContent = "자동 저장됨";
 }
 
 function loadDocuments() {
   try {
     const raw = localStorage.getItem(STORAGE_KEY);
     if (!raw) return [];
     return JSON.parse(raw);
   } catch (error) {
     return [];
   }
 }
 
 function loadLastDocument() {
   const docs = loadDocuments();
   const lastId = localStorage.getItem(LAST_OPENED_KEY);
   if (!docs.length) return null;
   const found = docs.find((doc) => doc.id === lastId);
   return found || docs[0];
 }
 
 function hydrateDocument(doc) {
   if (!doc) return;
   documentState = doc;
  currentPage = 0;
   render();
 }
 
 function exportPng() {
   const canvasArea = dom.canvas;
   if (!canvasArea || !window.html2canvas) return;
   dom.saveStatus.textContent = "PNG 생성 중...";
   window
     .html2canvas(canvasArea, { backgroundColor: "#ffffff", scale: 2 })
     .then((canvas) => {
       const link = document.createElement("a");
       const title = documentState.title || "cheongeum-note";
       link.download = `${title.replace(/\s+/g, "_")}.png`;
       link.href = canvas.toDataURL("image/png");
       link.click();
     })
     .finally(() => {
       dom.saveStatus.textContent = "자동 저장됨";
     });
 }

function waitForNextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

async function exportPdf() {
  const canvasArea = dom.canvas;
  if (!canvasArea || !window.html2canvas || !window.jspdf) return;
  dom.saveStatus.textContent = "PDF 생성 중...";

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");
  const totalPages = getTotalPages();
  const prevPage = currentPage;

  closeDrawer();

  try {
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
      currentPage = pageIndex;
      renderCanvas();
      await waitForNextFrame();

      const canvas = await window.html2canvas(canvasArea, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const imgData = canvas.toDataURL("image/png");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const renderWidth = imgWidth * ratio;
      const renderHeight = imgHeight * ratio;
      const marginX = (pageWidth - renderWidth) / 2;
      const marginY = (pageHeight - renderHeight) / 2;

      if (pageIndex > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, "PNG", marginX, marginY, renderWidth, renderHeight);
    }

    const title = documentState.title || "cheongeum-note";
    pdf.save(`${title.replace(/\s+/g, "_")}.pdf`);
  } finally {
    currentPage = prevPage;
    renderCanvas();
    dom.saveStatus.textContent = "자동 저장됨";
  }
}
 
 function bindEvents() {
   dom.applyLyricsBtn.addEventListener("click", () => {
     applyLyrics(dom.lyricsInput.value);
   });
 
   dom.titleInput.addEventListener("input", (event) => {
     documentState.title = event.target.value || "새 청음 노트";
     saveDocument();
   });
 
   dom.symbolSize.addEventListener("input", (event) => {
     const symbol = documentState.symbols.find(
       (item) => item.symbolId === selectedSymbolId
     );
     if (!symbol) return;
     symbol.style.size = Number(event.target.value);
     renderSymbols();
     saveDocument();
   });
 
   dom.symbolColor.addEventListener("input", (event) => {
     const symbol = documentState.symbols.find(
       (item) => item.symbolId === selectedSymbolId
     );
     if (!symbol) return;
     symbol.style.color = event.target.value;
     renderSymbols();
     saveDocument();
   });
 
   dom.deleteSymbolBtn.addEventListener("click", deleteSelectedSymbol);
 
   dom.exportBtn.addEventListener("click", exportPng);
  dom.exportPdfBtn.addEventListener("click", exportPdf);

  dom.prevPageBtn.addEventListener("click", () => {
    goToPage(currentPage - 1);
  });

  dom.nextPageBtn.addEventListener("click", () => {
    goToPage(currentPage + 1);
  });

  dom.openToolsBtn.addEventListener("click", () => {
    if (activeDrawer === "tools") {
      closeDrawer();
    } else {
      openDrawer("tools");
    }
  });

  dom.openInspectorBtn.addEventListener("click", () => {
    if (activeDrawer === "inspector") {
      closeDrawer();
    } else {
      openDrawer("inspector");
    }
  });

  dom.drawerOverlay.addEventListener("click", closeDrawer);
 
   window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawer();
    }
     if (event.key === "Backspace" || event.key === "Delete") {
       deleteSelectedSymbol();
     }
   });
 }
 
 function init() {
   const lastDoc = loadLastDocument();
   if (lastDoc) {
     hydrateDocument(lastDoc);
   } else {
     render();
   }
   bindEvents();
 }
 
 init();
