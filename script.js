let productInputCount = 1;
let parsedData = [];

function removeProductInput(btn) {
    btn.parentElement.remove();
}

function parseProducts() {
    const scenarioName = document.getElementById('scenarioName').value.trim();
    const productInputs = document.querySelectorAll('.product-input');
    
    if (!scenarioName) {
        showMessage('Please enter a scenario name', 'error');
        return;
    }

    if (productInputs.length === 0) {
        showMessage('Please add at least one product variable', 'error');
        return;
    }

    // Clear previous results and messages
    document.getElementById('results').innerHTML = '';
    clearMessages();
    parsedData = [];
    let allProducts = [];
    let invalidSyntaxDetected = false;

    productInputs.forEach((input, index) => {
        const value = input.value.trim();
        if (value) {
            if (!isValidProductSyntax(value)) {
                invalidSyntaxDetected = true;
                return;
            }
            const products = parseProductString(value, index + 1);
            allProducts = allProducts.concat(products);
        }
    });

    // If invalid syntax found, show only error paragraph - no table
    if (invalidSyntaxDetected) {
        document.getElementById('results').innerHTML = '<p class="validation-message">Invalid product syntax</p>';
        return;
    }

    if (allProducts.length === 0) {
        document.getElementById('results').innerHTML = '';
        showMessage('No valid product data found', 'error');
        return;
    }

    parsedData = allProducts;
    displayResults(scenarioName, allProducts);
    validateData(allProducts);
    showMessage(`Successfully parsed ${allProducts.length} products`, 'success');
}

function clearMessages() {
    const existingMessages = document.querySelectorAll('.validation-message, .success-message');
    existingMessages.forEach(msg => msg.remove());
}

function isValidProductSyntax(productString) {
    // Check if the string contains semicolons (basic Adobe Analytics product format)
    if (!productString.includes(';')) {
        return false;
    }

    // Split by comma to get individual products
    const products = productString.split(',');
    
    for (let product of products) {
        product = product.trim();
        if (!product) continue;
        
        // Each product should have at least 2 semicolons (category;sku;quantity minimum)
        const parts = product.split(';');
        console.log(parts.length)
        if (parts.length < 6) {
            return false;
        }
        
        // Check for basic structure - at least category and sku should be present
        if (!parts[0].trim() && !parts[1].trim()) {
            return false;
        }
    }
    
    return true;
}

function parseProductString(productString, sourceIndex) {
    const products = [];
    // Split by comma to get individual products
    const productItems = productString.split(',');

    productItems.forEach((item, index) => {
        if (item.trim()) {
            // Split by semicolon to get product attributes
            const attributes = item.split(';');
            
            const product = {
                sourceIndex: sourceIndex,
                originalIndex: index + 1,
                category: attributes[0] || '',
                sku: attributes[1] || '',
                quantity: attributes[2] || '',
                revenue: attributes[3] || '',
                events: attributes[4] || '',
                merchandising: attributes[5] || ''
            };

            products.push(product);
        }
    });

    return products;
}

function displayResults(scenarioName, products) {
    const resultsDiv = document.getElementById('results');
    
    let html = `
        <div class="table-container">
            <div class="scenario-title">${scenarioName}</div>
            <table id="productTable">
                <thead>
                    <tr>
                        <th>Scenario</th>
                        <th>Category</th>
                        <th>SKU</th>
                        <th>Quantity</th>
                        <th>Revenue</th>
                        <th>Events</th>
                        <th>Merchandising</th>
                    </tr>
                </thead>
                <tbody>
    `;

    products.forEach((product, index) => {
        // Format events with pipe separation as new lines
        const formattedEvents = product.events ? product.events.split('|').map(event => 
            `<div class="product-item">${event}</div>`
        ).join('') : '';

        // Format merchandising with pipe separation as new lines  
        const formattedMerchandising = product.merchandising ? product.merchandising.split('|').map(merch => 
            `<div class="product-item">${merch}</div>`
        ).join('') : '';

        html += `
            <tr>
                <td>${scenarioName}</td>
                <td class="category-cell">${product.category}</td>
                <td class="sku-cell">${product.sku}</td>
                <td class="quantity-cell">${product.quantity}</td>
                <td class="revenue-cell">${product.revenue}</td>
                <td class="events-cell">${formattedEvents}</td>
                <td class="merchandising-cell">${formattedMerchandising}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    resultsDiv.innerHTML = html;
}

function validateData(products) {
    products.forEach((product, index) => {
        const row = document.querySelector(`#productTable tbody tr:nth-child(${index + 1})`);
        
        // Validate quantity - should be numeric
        if (product.quantity && isNaN(product.quantity)) {
            row.querySelector('.quantity-cell').classList.add('error-cell');
        }

        // Validate revenue - should be numeric
        if (product.revenue && isNaN(product.revenue)) {
            row.querySelector('.revenue-cell').classList.add('error-cell');
        }

        // Validate SKU - should not be empty if category is present
        if (product.category && !product.sku) {
            row.querySelector('.sku-cell').classList.add('error-cell');
        }
    });
}

function exportToExcel() {
    if (parsedData.length === 0) {
        showMessage('No data to export. Please parse products first.', 'error');
        return;
    }

    const scenarioName = document.getElementById('scenarioName').value.trim();
    
    // Create CSV content
    let csvContent = `Scenario: ${scenarioName}\n\n`;
    csvContent += 'Category,SKU,Quantity,Revenue,Events,Merchandising,Validation Status\n';

    parsedData.forEach((product, index) => {
        const row = document.querySelector(`#productTable tbody tr:nth-child(${index + 1})`);
        let validationStatus = 'OK';
        
        if (row.querySelector('.error-cell')) {
            validationStatus = 'ERROR';
        }

        csvContent += `"${product.category}","${product.sku}","${product.quantity}","${product.revenue}","${product.events}","${product.merchandising}","${validationStatus}"\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenarioName.replace(/[^a-z0-9]/gi, '_')}_product_analysis.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showMessage('Data exported successfully!', 'success');
}

function clearAll() {
    document.getElementById('scenarioName').value = '';
    document.getElementById('productInputs').innerHTML = `
        <div class="product-entry">
            <label>Product Variable Value 1 <span class="input-counter">Entry 1</span></label>
            <textarea class="product-input" placeholder="Paste your product variable value from Adobe Analytics beacon (products parameter only)"></textarea>
        </div>
    `;
    document.getElementById('results').innerHTML = '';
    productInputCount = 1;
    parsedData = [];
    showMessage('All data cleared', 'success');
}

function showMessage(message, type) {
    // Clear any existing messages first
    clearMessages();

    const messageDiv = document.createElement('div');
    messageDiv.className = type === 'error' ? 'validation-message' : 'success-message';
    messageDiv.textContent = message;

    const inputSection = document.querySelector('.input-section');
    inputSection.appendChild(messageDiv);

    // For error messages, keep them visible longer
    const timeout = type === 'error' ? 8000 : 5000;
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, timeout);
}


