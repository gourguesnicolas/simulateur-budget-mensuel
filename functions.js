let SALARY = 2925;
let loyerAmt = 1615.65;
let lines = [
  {id:1,name:'Épicerie',amount:300},
  {id:2,name:'Électricité (Hydro-Québec)',amount:100},
  {id:3,name:'Internet',amount:55},
  {id:4,name:'Passe de bus',amount:99.50},
  {id:5,name:'Forfait téléphone',amount:33.96},
  {id:6,name:'Google One',amount:3.21},
  {id:7,name:'Autres (hygiène, santé, assurance...)',amount:139},
];
let nextId = 8;
let chart = null;

const COLORS = ['#D64B4B','#2F7C7A','#D08B3E','#3E658F','#2B8A63','#E07A5F','#7E8D3D','#7A6F63','#4A99B8','#C26457'];

function pct(part, total) {
  if (!total) return 0;
  return (part / total) * 100;
}

const doughnutPercentPlugin = {
  id: 'doughnutPercentLabels',
  afterDatasetsDraw(chartInstance) {
    const dataset = chartInstance.data.datasets[0];
    if (!dataset || !dataset.data || !dataset.data.length) return;

    const total = dataset.data.reduce((s, v) => s + v, 0);
    if (!total) return;

    const meta = chartInstance.getDatasetMeta(0);
    const ctx = chartInstance.ctx;
    ctx.save();
    ctx.font = '600 12px Manrope, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    meta.data.forEach((arc, i) => {
      const value = dataset.data[i] || 0;
      const percentage = pct(value, total);
      if (percentage < 5) return;

      const pos = arc.tooltipPosition();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(0,0,0,.22)';
      ctx.lineWidth = 3;
      const text = percentage.toFixed(0) + '%';
      ctx.strokeText(text, pos.x, pos.y);
      ctx.fillText(text, pos.x, pos.y);
    });

    ctx.restore();
  }
};

function fmt(n) {
  return n.toLocaleString('fr-CA', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' $';
}

function fmtNum(n) {
  return Number(n).toLocaleString('fr-CA', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function getBudgetSnapshot() {
  const celi = Math.max(0, parseFloat(document.getElementById('celi').value) || 0);
  const loisirs = Math.max(0, parseFloat(document.getElementById('loisirs').value) || 0);
  const totalOther = lines.reduce((s, l) => s + l.amount, 0);
  const totalDep = loyerAmt + totalOther + celi + loisirs;
  const solde = SALARY - totalDep;
  const loyerNameTxt = document.getElementById('loyer-name').textContent || 'Loyer';

  const entries = [
    {poste: loyerNameTxt, montant: loyerAmt, categorie: 'Loyer'},
    ...lines.map(l => ({poste:l.name, montant:l.amount, categorie:'Depenses fixes'}))
  ];

  if (celi > 0) entries.push({poste:'CELI/REER', montant:celi, categorie:'Epargne'});
  if (loisirs > 0) entries.push({poste:'Loisirs', montant:loisirs, categorie:'Epargne'});
  if (solde > 0) entries.push({poste:'Reste', montant:solde, categorie:'Solde'});

  const totalPie = entries.reduce((s, e) => s + e.montant, 0);
  const entriesWithPct = entries.map(e => ({
    ...e,
    pourcentage: totalPie > 0 ? (e.montant / totalPie) * 100 : 0
  }));

  return {
    salaire:SALARY,
    celi,
    loisirs,
    totalDep,
    solde,
    entries:entriesWithPct
  };
}

function getExportFileStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function categoryPalette(category) {
  if (category === 'Loyer') return 'FFFDECEC';
  if (category === 'Depenses fixes') return 'FFF0F8F7';
  if (category === 'Epargne') return 'FFECF6EF';
  if (category === 'Solde') return 'FFEAF1FB';
  return 'FFFFFFFF';
}

async function exportBudgetExcel() {
  const snap = getBudgetSnapshot();
  const fileName = `budget-mensuel-${getExportFileStamp()}.xlsx`;

  if (window.ExcelJS) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Simulateur Budget';
    wb.created = new Date();

    const ws = wb.addWorksheet('Budget mensuel', {
      views:[{state:'frozen', ySplit:7}]
    });

    ws.columns = [
      {header:'Poste', key:'poste', width:34},
      {header:'Categorie', key:'categorie', width:18},
      {header:'Montant', key:'montant', width:16},
      {header:'Part', key:'part', width:14},
      {header:'', key:'spacer', width:3},
      {header:'Résumé', key:'resumeLabel', width:18},
      {header:'Valeur', key:'resumeValue', width:16}
    ];

    ws.mergeCells('A1:G1');
    ws.getCell('A1').value = 'Budget mensuel';
    ws.getCell('A1').font = {name:'Calibri', size:16, bold:true, color:{argb:'FFFFFFFF'}};
    ws.getCell('A1').alignment = {vertical:'middle', horizontal:'left'};
    ws.getCell('A1').fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF1F7A78'}};
    ws.getRow(1).height = 24;

    ws.mergeCells('A2:D2');
    ws.getCell('A2').value = `Généré le ${getExportFileStamp()}`;
    ws.getCell('A2').font = {name:'Calibri', size:10, color:{argb:'FF5E6A70'}};

    const summaryRows = [
      ['Salaire', snap.salaire],
      ['Total depenses', snap.totalDep],
      ['Solde restant', snap.solde]
    ];

    summaryRows.forEach((item, idx) => {
      const r = 3 + idx;
      ws.getCell(`F${r}`).value = item[0];
      ws.getCell(`G${r}`).value = item[1];
      ws.getCell(`F${r}`).font = {bold:true, color:{argb:'FF26434D'}};
      ws.getCell(`G${r}`).numFmt = '#,##0.00" $"';
      ws.getCell(`F${r}`).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FFEAF5F2'}};
      ws.getCell(`G${r}`).fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FFF5FBF9'}};
      ws.getCell(`F${r}`).border = {top:{style:'thin', color:{argb:'FFC8DBD7'}}, left:{style:'thin', color:{argb:'FFC8DBD7'}}, bottom:{style:'thin', color:{argb:'FFC8DBD7'}}, right:{style:'thin', color:{argb:'FFC8DBD7'}}};
      ws.getCell(`G${r}`).border = {top:{style:'thin', color:{argb:'FFC8DBD7'}}, left:{style:'thin', color:{argb:'FFC8DBD7'}}, bottom:{style:'thin', color:{argb:'FFC8DBD7'}}, right:{style:'thin', color:{argb:'FFC8DBD7'}}};
    });

    const headerRow = 7;
    ['Poste', 'Categorie', 'Montant', 'Part (%)'].forEach((h, i) => {
      const cell = ws.getCell(headerRow, i + 1);
      cell.value = h;
      cell.font = {bold:true, color:{argb:'FFFFFFFF'}};
      cell.fill = {type:'pattern', pattern:'solid', fgColor:{argb:'FF2F7C7A'}};
      cell.alignment = {horizontal:'left', vertical:'middle'};
      cell.border = {top:{style:'thin', color:{argb:'FF246463'}}, left:{style:'thin', color:{argb:'FF246463'}}, bottom:{style:'thin', color:{argb:'FF246463'}}, right:{style:'thin', color:{argb:'FF246463'}}};
    });

    snap.entries.forEach((entry, idx) => {
      const r = headerRow + 1 + idx;
      ws.getCell(`A${r}`).value = entry.poste;
      ws.getCell(`B${r}`).value = entry.categorie;
      ws.getCell(`C${r}`).value = Number(entry.montant.toFixed(2));
      ws.getCell(`D${r}`).value = Number(entry.pourcentage.toFixed(2));

      ws.getCell(`C${r}`).numFmt = '#,##0.00" $"';
      ws.getCell(`D${r}`).numFmt = '0.00"%"';

      ['A', 'B', 'C', 'D'].forEach(col => {
        const c = ws.getCell(`${col}${r}`);
        c.fill = {type:'pattern', pattern:'solid', fgColor:{argb:categoryPalette(entry.categorie)}};
        c.border = {top:{style:'thin', color:{argb:'FFD7E2E0'}}, left:{style:'thin', color:{argb:'FFD7E2E0'}}, bottom:{style:'thin', color:{argb:'FFD7E2E0'}}, right:{style:'thin', color:{argb:'FFD7E2E0'}}};
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  if (!window.XLSX) {
    alert('Les librairies Excel ne sont pas disponibles.');
    return;
  }

  const rows = snap.entries.map(e => ({
    Poste: e.poste,
    Categorie: e.categorie,
    'Montant ($)': Number(e.montant.toFixed(2)),
    'Pourcentage (%)': Number(e.pourcentage.toFixed(2))
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:34}, {wch:16}, {wch:14}, {wch:16}];
  XLSX.utils.book_append_sheet(wb, ws, 'Budget');
  XLSX.writeFile(wb, fileName);
}

function exportBudgetPdf() {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('La librairie PDF n est pas disponible.');
    return;
  }

  const snap = getBudgetSnapshot();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const totalPie = snap.entries.reduce((s, e) => s + e.montant, 0);

  doc.setFillColor(31, 122, 120);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Budget mensuel', 14, 17);
  doc.setFontSize(10);
  doc.text(`Version du ${getExportFileStamp()}`, 14, 23);

  doc.setTextColor(31, 42, 48);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setFillColor(242, 248, 247);
  doc.roundedRect(14, 34, 86, 31, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé', 18, 41);
  doc.setFont('helvetica', 'normal');
  doc.text(`Salaire: ${fmt(snap.salaire)}`, 18, 48);
  doc.text(`Dépenses: ${fmt(snap.totalDep)}`, 18, 54);
  doc.text(`Solde: ${fmt(snap.solde)}`, 18, 60);

  const body = snap.entries.map(e => [
    e.poste,
    e.categorie,
    fmt(e.montant),
    `${e.pourcentage.toFixed(1).replace('.', ',')} %`
  ]);

  body.push(['', '', '', '']);
  body.push(['Total', '', fmt(totalPie), '100,0 %']);

  if (typeof doc.autoTable === 'function') {
    doc.autoTable({
      startY:74,
      head:[['Poste', 'Categorie', 'Montant', 'Part']],
      body,
      styles:{fontSize:9,cellPadding:2.5,textColor:[30, 38, 43]},
      headStyles:{fillColor:[47, 124, 122], textColor:[255, 255, 255]},
      didParseCell(data) {
        if (data.section !== 'body') return;
        const category = String(data.row.raw?.[1] || '');
        if (category === 'Loyer') data.cell.styles.fillColor = [255, 236, 236];
        if (category === 'épenses fixes') data.cell.styles.fillColor = [240, 248, 247];
        if (category === 'Épargne') data.cell.styles.fillColor = [236, 246, 239];
        if (category === 'Solde') data.cell.styles.fillColor = [234, 241, 251];
      }
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 270;
    doc.setFontSize(9);
    doc.setTextColor(95, 106, 112);
    doc.text('Rapport généré par le simulateur de budget mensuel.', 14, Math.min(finalY + 10, 287));
  } else {
    let y = 74;
    body.forEach(row => {
      doc.text(`${row[0]} | ${row[2]} | ${row[3]}`, 14, y);
      y += 6;
    });
  }

  doc.save(`budget-mensuel-${getExportFileStamp()}.pdf`);
}

function closeSaveMenu() {
  const menu = document.getElementById('save-menu');
  const btn = document.getElementById('save-fab');
  const label = document.getElementById('save-fab-label');
  if (!menu || !btn) return;
  menu.classList.remove('open');
  menu.setAttribute('aria-hidden', 'true');
  btn.setAttribute('aria-expanded', 'false');
  if (label) label.textContent = 'Enregistrer';
  btn.classList.remove('is-cancel');
}

function toggleSaveMenu() {
  const menu = document.getElementById('save-menu');
  const btn = document.getElementById('save-fab');
  const label = document.getElementById('save-fab-label');
  if (!menu || !btn) return;
  const willOpen = !menu.classList.contains('open');
  if (willOpen) {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    if (label) label.textContent = 'Annuler';
    btn.classList.add('is-cancel');
  } else {
    closeSaveMenu();
  }
}

function editSalary(el) {
  if (el.querySelector('input')) return;
  const input = document.createElement('input');
  input.className = 'edit-input salary-input';
  input.type = 'number'; input.min = '0'; input.step = '1';
  input.value = SALARY.toFixed(2);
  el.textContent = ''; el.appendChild(input);
  input.focus(); input.select();
  function save() {
    const val = Math.max(0, parseFloat(input.value) || 0);
    SALARY = val; el.textContent = fmt(val); update();
  }
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { el.textContent = fmt(SALARY); }
  });
}

function startEditText(el) {
  if (el.querySelector('input')) return;
  const cur = el.textContent;
  const input = document.createElement('input');
  input.className = 'edit-input ni'; input.value = cur;
  el.textContent = ''; el.appendChild(input);
  input.focus(); input.select();
  function save() {
    const val = input.value.trim() || cur;
    const id = el.dataset.id;
    if (id) { const l = lines.find(x => x.id == id); if (l) l.name = val; renderLines(); }
    else { el.textContent = val; update(); }
  }
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { input.value = cur; input.blur(); }
  });
}

function startEditAmt(el, idOrKey) {
  if (el.querySelector('input')) return;
  let curVal = idOrKey === 'loyer' ? loyerAmt : (lines.find(l => l.id == idOrKey) || {}).amount || 0;
  const input = document.createElement('input');
  input.className = 'edit-input ai'; input.type = 'number'; input.min = '0'; input.step = '1';
  input.value = curVal.toFixed(2);
  el.textContent = ''; el.appendChild(input);
  input.focus(); input.select();
  function save() {
    const val = Math.max(0, parseFloat(input.value) || 0);
    if (idOrKey === 'loyer') { loyerAmt = val; el.textContent = fmt(val); update(); }
    else { const l = lines.find(x => x.id == idOrKey); if (l) l.amount = val; renderLines(); }
  }
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { el.textContent = fmt(curVal); }
  });
}

function editLoyerRatio(el) {
  if (el.querySelector('input')) return;
  const currentRatio = SALARY > 0 ? (loyerAmt / SALARY) * 100 : 0;
  const input = document.createElement('input');
  input.className = 'edit-input ai';
  input.type = 'number';
  input.min = '0';
  input.step = '1';
  input.value = currentRatio.toFixed(0);

  el.textContent = '';
  el.appendChild(input);
  input.focus();
  input.select();

  function save() {
    const ratioVal = Math.max(0, parseFloat(input.value) || 0);
    loyerAmt = SALARY > 0 ? (SALARY * ratioVal) / 100 : 0;

    const loyerAmtEl = document.getElementById('loyer-amt');
    if (loyerAmtEl) loyerAmtEl.textContent = fmt(loyerAmt);

    update();
  }

  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') {
      el.textContent = Math.round(currentRatio) + '%';
    }
  });
}

function askDelete(id) {
  closeAllBubbles();
  const row = document.getElementById('line-' + id);
  if (!row) return;
  const line = lines.find(l => l.id === id);
  const bubble = document.createElement('div');
  bubble.className = 'bubble'; bubble.id = 'bubble-' + id;
  bubble.innerHTML = `<span>Supprimer <strong style="font-weight:500;color:#1a1a18;">${esc(line.name)}</strong>&nbsp;?</span>
    <button class="cb-cancel" onclick="closeAllBubbles()">Annuler</button>
    <button class="cb-del" onclick="confirmDelete(${id})">Supprimer</button>`;
  row.appendChild(bubble);
}

function closeAllBubbles() {
  document.querySelectorAll('.bubble').forEach(b => b.remove());
}

function confirmDelete(id) {
  lines = lines.filter(l => l.id !== id);
  closeAllBubbles();
  renderLines();
}

function addLine() {
  const id = nextId++;
  lines.push({id, name:'Nouvelle dépense', amount:0});
  renderLines();
  setTimeout(() => {
    const el = document.querySelector(`[data-id="${id}"][data-field="name"]`);
    if (el) startEditText(el);
  }, 50);
}

function renderLines() {
  const list = document.getElementById('fixed-list');
  list.innerHTML = '';
  lines.forEach(line => {
    const div = document.createElement('div');
    div.className = 'li'; div.id = 'line-' + line.id;
    div.innerHTML = `
      <div class="li-left">
        <span class="editable" data-id="${line.id}" data-field="name" onclick="startEditText(this)">${esc(line.name)}</span>
      </div>
      <div class="li-right">
        <span class="editable" data-id="${line.id}" data-field="amount" style="font-weight:500;" onclick="startEditAmt(this,${line.id})">${fmt(line.amount)}</span>
        <button class="trash-btn" onclick="askDelete(${line.id})" title="Supprimer">
          <img class="trash-btn-icon" src="https://cdn-icons-png.flaticon.com/512/484/484611.png" alt="" aria-hidden="true" loading="lazy" onerror="this.style.display='none'">
        </button>
      </div>`;
    list.appendChild(div);
  });
  update();
}

function update() {
  const celi = Math.max(0, parseFloat(document.getElementById('celi').value) || 0);
  const loisirs = Math.max(0, parseFloat(document.getElementById('loisirs').value) || 0);
  const totalOther = lines.reduce((s, l) => s + l.amount, 0);
  const totalDep = loyerAmt + totalOther + celi + loisirs;
  const solde = SALARY - totalDep;
  const ratio = SALARY > 0 ? Math.round((loyerAmt / SALARY) * 100) : 0;
  const maxLoyer = Math.round(SALARY * 0.3);

  document.getElementById('tot').textContent = fmt(totalDep);
  document.getElementById('rlbl').textContent = ratio + '%';
  const rfillEl = document.getElementById('rfill');
  rfillEl.style.width = Math.min(ratio, 100) + '%';
  if (ratio <= 30) {
    rfillEl.style.background = 'linear-gradient(90deg,#64b889,#2b8a63)';
  } else if (ratio <= 35) {
    rfillEl.style.background = 'linear-gradient(90deg,#e8bf69,#ba7517)';
  } else {
    rfillEl.style.background = 'linear-gradient(90deg,#e87f6e,#d64949)';
  }
  document.getElementById('ratio-hint').textContent = 'La règle du 30% recommande max ~' + maxLoyer.toLocaleString('fr-CA') + ' $/mois pour ce salaire';
  document.getElementById('loyer-note').textContent = ratio + '% du salaire net' + (ratio > 30 ? ' — au-dessus du seuil recommandé (30%)' : '');

  const sEl = document.getElementById('solde');
  sEl.textContent = fmt(solde);
  sEl.style.color = solde < 0 ? '#E24B4A' : solde < 150 ? '#BA7517' : '#1D9E75';
  const rEl = document.getElementById('reste');
  rEl.textContent = fmt(solde);
  rEl.style.color = solde < 0 ? '#E24B4A' : solde < 150 ? '#BA7517' : '#1D9E75';

  const az = document.getElementById('alert-zone');
  if (solde < 0) az.innerHTML = `<div class="alert-d">Budget déficitaire de ${fmt(Math.abs(solde))} — réduis épargne ou loisirs.</div>`;
  else if (solde < 150) az.innerHTML = `<div class="alert-w">Marge très serrée — aucune place pour les imprévus.</div>`;
  else az.innerHTML = '';

  const loyerNameTxt = document.getElementById('loyer-name').textContent || 'Loyer';
  const labels = [loyerNameTxt, ...lines.map(l => l.name)];
  const data = [loyerAmt, ...lines.map(l => l.amount)];
  if (celi > 0) { labels.push('CELI/REER'); data.push(celi); }
  if (loisirs > 0) { labels.push('Loisirs'); data.push(loisirs); }
  if (solde > 0) { labels.push('Reste'); data.push(solde); }

  if (chart) { chart.data.labels = labels; chart.data.datasets[0].data = data; chart.update('none'); }

  const totalChart = data.reduce((s, v) => s + v, 0);
  document.getElementById('legend').innerHTML = labels.map((l, i) => {
    const percentage = pct(data[i], totalChart);
    return `<span class="legend-item"><span class="legend-dot" style="background:${COLORS[i % COLORS.length]};"></span>${esc(l)} (${percentage.toFixed(1).replace('.', ',')}%)</span>`;
  }
  ).join('');
}

function initChart() {
  const ctx = document.getElementById('bc').getContext('2d');
  chart = new Chart(ctx, {
    type: 'doughnut',
    plugins:[doughnutPercentPlugin],
    data: {labels:[], datasets:[{data:[], backgroundColor:COLORS, borderWidth:2, borderColor:'#f8f5ec', hoverOffset:8, spacing:2, borderRadius:5}]},
    options: {
      responsive:true, maintainAspectRatio:false,
      cutout:'62%',
      animation:{duration:650, easing:'easeOutQuart'},
      layout:{padding:{top:6,right:8,bottom:6,left:8}},
      plugins: {
        legend:{display:false},
        tooltip:{
          displayColors:false,
          backgroundColor:'#1f2a30',
          titleColor:'#f6f6f4',
          bodyColor:'#f6f6f4',
          cornerRadius:10,
          padding:10,
          callbacks:{
            label(c) {
              const total = c.dataset.data.reduce((s, v) => s + v, 0);
              const percentage = pct(c.parsed, total);
              return ' ' + c.label + ': ' + c.parsed.toFixed(2).replace('.',',') + ' $ (' + percentage.toFixed(1).replace('.', ',') + '%)';
            }
          }
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initChart();
  document.getElementById('celi').addEventListener('input', update);
  document.getElementById('loisirs').addEventListener('input', update);

  const saveFab = document.getElementById('save-fab');
  const exportExcelBtn = document.getElementById('export-excel');
  const exportPdfBtn = document.getElementById('export-pdf');

  if (saveFab) {
    saveFab.addEventListener('click', e => {
      e.stopPropagation();
      toggleSaveMenu();
    });
  }
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      exportBudgetExcel();
      closeSaveMenu();
    });
  }
  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
      exportBudgetPdf();
      closeSaveMenu();
    });
  }

  document.addEventListener('click', e => {
    const wrap = document.querySelector('.save-fab-wrap');
    if (wrap && !wrap.contains(e.target)) closeSaveMenu();
  });

  renderLines();
});
