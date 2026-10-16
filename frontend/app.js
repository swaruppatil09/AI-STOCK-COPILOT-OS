document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. NAVIGATION ROUTING
    // ==========================================
    window.switchView = function(viewId) {
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        const targetView = document.getElementById(viewId);
        if (targetView) targetView.classList.add('active');

        document.querySelectorAll('.sidebar .nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.target === viewId) btn.classList.add('active');
        });
    };

    document.querySelectorAll('.sidebar .nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchView(e.currentTarget.dataset.target);
        });
    });

    // ==========================================
    // 2. STOCK POOL SELECTION
    // ==========================================
    const MASTER_POOL = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "INFY.NS", 
        "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "BAJFINANCE.NS", "L&T.NS",
        "HUL.NS", "AXISBANK.NS", "MARUTI.NS", "SUNPHARMA.NS", "KOTAKBANK.NS",
        "TITAN.NS", "ASIANPAINT.NS", "TATAMOTORS.NS", "TATASTEEL.NS", "WIPRO.NS"
    ];

    let selectedTickers = new Set(MASTER_POOL.slice(0, 6));

    function renderStockPool() {
        const container = document.getElementById('massive-stock-pool');
        const countLabel = document.getElementById('selection-count');
        if (!container || !countLabel) return;

        container.innerHTML = '';
        MASTER_POOL.forEach(ticker => {
            const chip = document.createElement('div');
            chip.className = `pool-chip ${selectedTickers.has(ticker) ? 'selected' : ''}`;
            chip.innerText = ticker.replace('.NS', '');

            chip.addEventListener('click', () => {
                if (selectedTickers.has(ticker)) {
                    selectedTickers.delete(ticker);
                    chip.classList.remove('selected');
                } else {
                    selectedTickers.add(ticker);
                    chip.classList.add('selected');
                }
                countLabel.innerText = `${selectedTickers.size} Selected`;
            });
            container.appendChild(chip);
        });
        countLabel.innerText = `${selectedTickers.size} Selected`;
    }

    // ==========================================
    // 2.5 LIVE SEARCH ENGINE LOGIC
    // ==========================================
    const customInput = document.getElementById('custom-ticker-input');
    const addBtn = document.getElementById('add-ticker-btn');

    if (addBtn && customInput) {
        addBtn.addEventListener('click', () => {
            let newTicker = customInput.value.trim().toUpperCase();
            if (!newTicker) return;

            // Automatically append the NSE suffix if the user forgets it
            if (!newTicker.includes('.NS') && !newTicker.includes('.BO')) {
                newTicker += '.NS';
            }

            // Add to the master pool if it doesn't exist
            if (!MASTER_POOL.includes(newTicker)) {
                MASTER_POOL.unshift(newTicker); // Adds it to the very front of the list
            }
            
            // Automatically select it and re-render the grid
            selectedTickers.add(newTicker);
            customInput.value = '';
            renderStockPool();
        });

        // Allow pressing 'Enter' on the keyboard to add the stock
        customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addBtn.click();
        });
    }

    // ==========================================
    // 3. EVALUATION & ALLOCATION ENGINE
    // ==========================================
    async function generatePlan() {
        if (selectedTickers.size === 0) {
            alert("Select at least one stock to analyze.");
            return;
        }

        const btn = document.getElementById('calculate-btn');
        const budget = parseFloat(document.getElementById('budget-input').value) || 50000;
        const mode = document.getElementById('mode-select').value;
        const topN = parseInt(document.getElementById('top-n-input').value) || 4;

        btn.disabled = true;
        btn.innerText = "Analyzing...";

        try {
            const tickerString = Array.from(selectedTickers).join(',');
          const res = await fetch(`https://ai-stock-copilot-os.onrender.com/api/plan?budget=${budget}&plan_type=${mode}&tickers=${tickerString}&top_n=${topN}`);
            const result = await res.json();

            if (result.status === "success") {
                renderActionPlan(result.recommended_stocks);
                renderLeaderboard(result.all_ranked_stocks);

                const summary = document.getElementById('budget-summary');
                if (summary) {
                    summary.style.display = 'flex';
                    document.getElementById('allocated-info').innerText = `Target Budget: ₹${Number(result.budget).toLocaleString()}`;
                    document.getElementById('cash-info').innerText = `Cash Buffer: ₹${Number(result.remaining_cash).toLocaleString()}`;
                }

                // --- DYNAMIC PORTFOLIO SYNC (MY INVESTMENTS TAB) ---
                document.getElementById('empty-portfolio-msg').style.display = 'none';
                document.getElementById('active-portfolio-dashboard').style.display = 'flex';

                const totalBudget = Number(result.budget);
                const totalInvested = totalBudget - Number(result.remaining_cash);
                const eqPct = totalBudget > 0 ? Math.round((totalInvested / totalBudget) * 100) : 0;
                const cashPct = 100 - eqPct;

                document.getElementById('port-allocated').innerText = `₹${totalInvested.toLocaleString()}`;
                document.getElementById('port-cash').innerText = `Remaining Cash Buffer: ₹${Number(result.remaining_cash).toLocaleString()}`;
                document.getElementById('port-exposure').innerText = `${eqPct} / ${cashPct}`;

                const portBody = document.getElementById('portfolio-tbody');
                portBody.innerHTML = '';
                
                result.recommended_stocks.forEach(s => {
                    const allocPct = totalInvested > 0 ? ((s.invested_amount / totalInvested) * 100).toFixed(1) : 0;
                    portBody.innerHTML += `
                        <tr>
                            <td><strong>${s.name}</strong> <small style="color: #848e9c;">(${s.ticker})</small></td>
                            <td>${s.suggested_shares} Units</td>
                            <td style="color: #00bfa5; font-weight: 600;">₹${Number(s.invested_amount).toLocaleString()}</td>
                            <td style="font-weight: bold;">${allocPct}%</td>
                        </tr>
                    `;
                });
                // ----------------------------------------------------
            }
        } catch (err) {
            console.error(err);
            const planBody = document.getElementById('plan-tbody');
            if (planBody) {
                planBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef5350;">Could not reach backend. Verify uvicorn is running on port 8000.</td></tr>`;
            }
        } finally {
            btn.disabled = false;
            btn.innerText = "Evaluate Market";
        }
    }

    function renderActionPlan(stocks) {
        const tbody = document.getElementById('plan-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        stocks.forEach(s => {
            const riskClass = s.risk_level.includes("Low") ? "risk-low" : (s.risk_level.includes("Mod") ? "risk-mod" : "risk-high");
            tbody.innerHTML += `
                <tr>
                    <td><strong>${s.name}</strong><br><small style="color: #848e9c;">${s.ticker}</small></td>
                    <td>₹${Number(s.price).toLocaleString()}</td>
                    <td><span class="badge-risk ${riskClass}">${s.risk_level}</span></td>
                    <td><strong style="color: #2962ff;">${s.score}</strong>/100</td>
                    <td><strong>Buy ${s.suggested_shares} units</strong><br><small style="color: #848e9c;">(₹${Number(s.invested_amount).toLocaleString()})</small></td>
                    <td><button class="view-chart-btn" data-ticker="${s.ticker}" data-name="${s.name}" style="padding: 6px 12px; font-size: 12px; background: transparent; border: 1px solid #2962ff; color: #2962ff;">Chart</button></td>
                </tr>
            `;
        });
    }

    function renderLeaderboard(stocks) {
        const tbody = document.getElementById('leaderboard-tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        stocks.forEach(s => {
            const retColor = s.raw_return >= 0 ? "#00bfa5" : "#ff5252";
            const rsiColor = (s.rsi >= 40 && s.rsi <= 65) ? "#2962ff" : (s.rsi > 70 ? "#ff5252" : "#fbc02d");
            const trendBadge = s.trend.includes("Bullish") 
                ? '<span style="color: #00bfa5; font-size: 11px; font-weight: 600;">▲ Bullish</span>' 
                : '<span style="color: #ff5252; font-size: 11px; font-weight: 600;">▼ Bearish</span>';

            tbody.innerHTML += `
                <tr>
                    <td><strong>${s.name}</strong><br><small style="color: #848e9c;">${s.ticker}</small></td>
                    <td style="color: ${retColor}; font-weight: 600;">${s.one_year_return}</td>
                    <td style="color: ${rsiColor}; font-weight: 700;">${s.rsi}</td>
                    <td>${trendBadge}</td>
                    <td>${s.pe_ratio}</td>
                    <td style="font-weight: bold; font-size: 15px; color: #fff;">${s.score}</td>
                    <td><button class="view-chart-btn" data-ticker="${s.ticker}" data-name="${s.name}" style="padding: 6px 12px; font-size: 12px; background: transparent; border: 1px solid #2962ff; color: #2962ff;">Chart</button></td>
                </tr>
            `;
        });
    }

    // ==========================================
    // 4. CHART MODAL & SMA TIMEFRAMES
    // ==========================================
    let chartInstance = null;
    let candleSeries = null;
    let smaSeries = null;
    let currentChartData = [];

    function calculateSMA(data, period) {
        const sma = [];
        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) { sum += data[i - j].close; }
            sma.push({ time: data[i].time, value: sum / period });
        }
        return sma;
    }

    async function openStockChart(ticker, name) {
        const modal = document.getElementById('chart-modal');
        document.getElementById('modal-stock-title').innerText = `${name} (${ticker})`;
        modal.style.display = 'flex';

        document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
        const defaultTf = document.querySelector('.tf-btn[data-months="12"]');
        if (defaultTf) defaultTf.classList.add('active');

        const chartContainer = document.getElementById('tv-chart');
        chartContainer.innerHTML = '';

        // Upgraded Chart Layout with Watermark
        chartInstance = LightweightCharts.createChart(chartContainer, {
            layout: { 
                background: { type: 'solid', color: 'transparent' }, 
                textColor: '#848e9c' 
            },
            watermark: {
                color: 'rgba(255, 255, 255, 0.03)',
                visible: true,
                text: ticker,
                fontSize: 100,
                horzAlign: 'center',
                vertAlign: 'center',
            },
            grid: { vertLines: { color: 'rgba(255, 255, 255, 0.05)' }, horzLines: { color: 'rgba(255, 255, 255, 0.05)' } },
            timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true },
        });

        candleSeries = chartInstance.addCandlestickSeries({
            upColor: '#00bfa5', downColor: '#ff5252', borderVisible: false, wickUpColor: '#00bfa5', wickDownColor: '#ff5252'
        });
        
        smaSeries = chartInstance.addLineSeries({ 
            color: '#2962ff', lineWidth: 2, crosshairMarkerVisible: false, priceLineVisible: false 
        });

        // Add Volume Histogram at the bottom 25% of the chart
        const volumeSeries = chartInstance.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: '', // Keeps volume separate from price scale
        });
        volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.75, bottom: 0 },
        });

        try {
            const res = await fetch(`https://ai-stock-copilot-os.onrender.com/api/chart/${ticker}`);
            const data = await res.json();
            if (data.status === "success" && data.data.length > 0) {
                currentChartData = data.data;
                
                // Map data for Candles and Volume
                const volData = currentChartData.map(d => ({
                    time: d.time,
                    value: d.volume,
                    color: d.close >= d.open ? 'rgba(0, 191, 165, 0.4)' : 'rgba(255, 82, 82, 0.4)' // Green/Red volume bars
                }));

                candleSeries.setData(currentChartData);
                smaSeries.setData(calculateSMA(currentChartData, 50));
                volumeSeries.setData(volData);
                
                chartInstance.timeScale().fitContent();
            }
        } catch (e) {
            console.error("Chart load failed", e);
        }
    }

    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            if (currentChartData.length === 0 || !chartInstance) return;

            const months = parseInt(e.target.dataset.months);
            const lastDataPoint = currentChartData[currentChartData.length - 1];
            const endDate = new Date(lastDataPoint.time);
            const startDate = new Date(endDate);
            startDate.setMonth(startDate.getMonth() - months);

            chartInstance.timeScale().setVisibleRange({
                from: startDate.toISOString().split('T')[0],
                to: endDate.toISOString().split('T')[0]
            });
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('view-chart-btn')) {
            openStockChart(e.target.dataset.ticker, e.target.dataset.name);
        }
    });

    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('chart-modal').style.display = 'none';
        });
    }

    // ==========================================
    // 5. STEP-UP SIP CALCULATOR
    // ==========================================
    function calculateAdvancedSIP() {
        let monthlyDeposit = parseFloat(document.getElementById('sip-amount').value) || 10000;
        const annualRate = parseFloat(document.getElementById('sip-rate').value) || 12;
        const years = parseInt(document.getElementById('sip-years').value) || 10;
        const stepUpPct = parseFloat(document.getElementById('sip-stepup').value) || 0;

        const monthlyRate = (annualRate / 100) / 12;
        let totalInvested = 0;
        let maturityValue = 0;

        for (let yr = 0; yr < years; yr++) {
            for (let m = 0; m < 12; m++) {
                totalInvested += monthlyDeposit;
                const monthsRemaining = (years * 12) - (yr * 12 + m);
                maturityValue += monthlyDeposit * Math.pow(1 + monthlyRate, monthsRemaining);
            }
            monthlyDeposit *= (1 + (stepUpPct / 100));
        }

        const wealthGained = maturityValue - totalInvested;
        const principalPct = Math.max(1, Math.min(99, Math.round((totalInvested / maturityValue) * 100)));
        const returnsPct = 100 - principalPct;

        const fmt = { maximumFractionDigits: 0 };
        document.getElementById('sip-total').innerText = `₹${Math.round(maturityValue).toLocaleString('en-IN', fmt)}`;
        document.getElementById('sip-invested').innerText = `₹${Math.round(totalInvested).toLocaleString('en-IN', fmt)}`;
        document.getElementById('sip-gains').innerText = `₹${Math.round(wealthGained).toLocaleString('en-IN', fmt)}`;

        document.getElementById('sip-bar-principal').style.width = `${principalPct}%`;
        document.getElementById('sip-bar-returns').style.width = `${returnsPct}%`;
        document.getElementById('bar-invested-label').innerText = `Principal: ${principalPct}%`;
        document.getElementById('bar-gain-label').innerText = `Returns: ${returnsPct}%`;
    }

    const sipBtn = document.getElementById('calc-sip-btn');
    if (sipBtn) sipBtn.addEventListener('click', calculateAdvancedSIP);

    // ==========================================
    // INITIALIZATION
    // ==========================================
    const evalBtn = document.getElementById('calculate-btn');
    if (evalBtn) evalBtn.addEventListener('click', generatePlan);
    renderStockPool();
    calculateAdvancedSIP();
});

// ==========================================
    // 7. INSTITUTIONAL PDF REPORT GENERATOR
    // ==========================================
    const downloadPdfBtn = document.getElementById('download-pdf-btn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            const originalBtnText = downloadPdfBtn.innerText;
            downloadPdfBtn.innerText = "⏳ Generating Report...";
            downloadPdfBtn.disabled = true;

            // Extract live values from dashboard
            const allocated = document.getElementById('port-allocated').innerText;
            const cash = document.getElementById('port-cash').innerText;
            const exposure = document.getElementById('port-exposure').innerText;
            const tableRows = document.getElementById('portfolio-tbody').innerHTML;
            const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

            // Create an isolated printable container (eliminates sidebar coordinate clipping)
            const report = document.createElement('div');
            report.style.width = '1000px';
            report.style.padding = '36px 40px';
            report.style.backgroundColor = '#0b0e14';
            report.style.color = '#f0f2f5';
            report.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            report.style.boxSizing = 'border-box';

            report.innerHTML = `
                <div style="border-bottom: 2px solid #2962ff; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <h1 style="margin: 0; font-size: 26px; color: #ffffff; letter-spacing: -0.5px;">AI STOCK COPILOT</h1>
                        <p style="margin: 4px 0 0 0; color: #2962ff; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                            Portfolio Capital Allocation & Risk Audit
                        </p>
                    </div>
                    <div style="text-align: right; font-size: 12px; color: #9aa4b2; line-height: 1.5;">
                        <div><strong>Report Date:</strong> ${dateStr}</div>
                        <div><strong>Engine Status:</strong> Optimized & Validated</div>
                    </div>
                </div>

                <div style="display: flex; gap: 20px; margin-bottom: 28px;">
                    <div style="flex: 1; background: #131822; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 22px; text-align: center;">
                        <div style="font-size: 11px; color: #9aa4b2; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Total Capital Allocated</div>
                        <div style="font-size: 32px; color: #2962ff; font-weight: 800; margin: 8px 0;">${allocated}</div>
                        <div style="font-size: 12px; color: #00bfa5; font-weight: 600;">${cash}</div>
                    </div>
                    <div style="flex: 1; background: #131822; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 22px; text-align: center;">
                        <div style="font-size: 11px; color: #9aa4b2; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Asset Exposure Split</div>
                        <div style="font-size: 32px; color: #00bfa5; font-weight: 800; margin: 8px 0;">${exposure}</div>
                        <div style="font-size: 12px; color: #9aa4b2; font-weight: 600;">Equities (%) : Liquid Cash Reserve (%)</div>
                    </div>
                </div>

                <div style="background: #131822; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 15px; color: #ffffff; text-transform: uppercase; letter-spacing: 0.5px;">
                        Active Portfolio Holdings
                    </h3>
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
                        <thead>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.12); color: #9aa4b2; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">
                                <th style="padding: 10px 12px;">Stock / Ticker</th>
                                <th style="padding: 10px 12px;">Units Owned</th>
                                <th style="padding: 10px 12px;">Capital Deployed</th>
                                <th style="padding: 10px 12px;">Portfolio Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>

                <div style="padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; font-size: 11px; color: #848e9c;">
                    <span>System Architecture: AI Stock Copilot (FastAPI + JS Core)</span>
                    <span>Ashokrao Mane Group of Institutions, Vathar</span>
                </div>
            `;

            const opt = {
                margin:       [0.3, 0.3, 0.3, 0.3],
                filename:     'AI_Stock_Copilot_Investment_Plan.pdf',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0b0e14' },
                jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
            };

            html2pdf().set(opt).from(report).save().then(() => {
                downloadPdfBtn.innerText = originalBtnText;
                downloadPdfBtn.disabled = false;
            });
        });
    }