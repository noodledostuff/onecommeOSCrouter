// OneComme OSC Conditional Routing Web UI
class RoutingUI {
    constructor() {
        this.rules = [];
        this.templates = [];
        this.init();
    }

    async init() {
        await this.loadRules();
        await this.loadTemplates();
        this.setupEventListeners();
        this.renderRules();
        this.renderTemplates();
        this.startLogAutoRefresh();
    }

    async loadRules() {
        try {
            const response = await fetch('/api/rules');
            const data = await response.json();
            this.rules = data.rules || [];
        } catch (error) {
            console.error('Failed to load rules:', error);
            this.showNotification('Failed to load rules', 'error');
        }
    }

    async loadTemplates() {
        try {
            const response = await fetch('/api/templates');
            const data = await response.json();
            this.templates = data.templates || [];
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('rule-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRule();
        });

        // Modal close when clicking outside
        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeEditModal();
            }
        });
    }

    switchTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load data for specific tabs
        if (tabName === 'rules') {
            this.refreshRules();
        } else if (tabName === 'settings') {
            this.loadConfigurationUI();
        } else if (tabName === 'logs') {
            this.loadLogs();
        }
    }

    async refreshRules() {
        await this.loadRules();
        this.renderRules();
    }

    renderRules() {
        const container = document.getElementById('rules-container');
        
        if (this.rules.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #718096;">
                    <i class="fas fa-route" style="font-size: 48px; margin-bottom: 20px;"></i>
                    <h3>No routing rules configured</h3>
                    <p>Create your first rule to get started with conditional message routing.</p>
                    <button class="btn btn-primary" onclick="switchTab('create')" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Create First Rule
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.rules.map(rule => `
            <div class="rule-card animate__animated animate__fadeIn">
                <div class="rule-header">
                    <div class="rule-title">${rule.name || 'Unnamed Rule'}</div>
                    <div class="rule-toggle">
                        <label class="toggle-switch">
                            <input type="checkbox" ${rule.enabled ? 'checked' : ''} 
                                   onchange="app.toggleRule('${rule.id}', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                    <div class="rule-actions">
                        <button class="btn btn-secondary" onclick="app.editRule('${rule.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="app.deleteRule('${rule.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                ${rule.description ? `<p style="color: #718096; margin-bottom: 10px;">${rule.description}</p>` : ''}
                <div class="rule-conditions">
                    <strong>Conditions:</strong> 
                    ${this.renderConditionSummary(rule)}
                </div>
                <div class="rule-conditions">
                    <strong>Actions:</strong> 
                    ${this.renderActionSummary(rule)}
                </div>
            </div>
        `).join('');
    }

    renderConditionSummary(rule) {
        if (!rule.conditions || rule.conditions.length === 0) {
            return '<span class="condition-badge">Always matches</span>';
        }

        const logic = rule.conditionLogic || 'AND';
        const conditions = rule.conditions.map(condition => {
            const operator = this.getOperatorDisplay(condition.operator);
            return `<span class="condition-badge">${condition.field} ${operator} ${condition.value}</span>`;
        }).join(` <strong>${logic}</strong> `);

        return conditions;
    }

    renderActionSummary(rule) {
        if (!rule.actions || rule.actions.length === 0) {
            return '<span class="condition-badge">No custom actions</span>';
        }

        return rule.actions.map(action => {
            if (action.type === 'route_to_endpoint') {
                const fieldsCount = action.fields ? action.fields.length : 'all';
                return `<span class="condition-badge">Route to ${action.endpoint} (${fieldsCount} fields)</span>`;
            }
            return `<span class="condition-badge">${action.type}</span>`;
        }).join(' ');
    }

    getOperatorDisplay(operator) {
        const operators = {
            'equals': '=',
            'not_equals': '≠',
            'greater_than': '>',
            'greater_than_or_equal': '≥',
            'less_than': '<',
            'less_than_or_equal': '≤',
            'contains': 'contains',
            'not_contains': 'not contains',
            'starts_with': 'starts with',
            'ends_with': 'ends with',
            'regex': 'matches regex'
        };
        return operators[operator] || operator;
    }

    renderTemplates() {
        const container = document.getElementById('templates-container');
        
        container.innerHTML = this.templates.map(template => `
            <div class="template-card" onclick="app.useTemplate('${template.name}')">
                <div class="template-title">
                    <i class="fas fa-magic"></i> ${template.name}
                </div>
                <div class="template-description">
                    ${template.description}
                </div>
            </div>
        `).join('');
    }

    async useTemplate(templateName) {
        const template = this.templates.find(t => t.name === templateName);
        if (!template) return;

        // Switch to create tab and populate form
        this.switchTab('create');
        
        // Populate form with template data
        document.getElementById('rule-name').value = template.rule.name;
        document.getElementById('rule-description').value = template.description;
        
        // Set conditions
        this.populateConditions(template.rule.conditions);
        
        // Set condition logic
        const logicRadio = document.querySelector(`input[name="condition-logic"][value="${template.rule.conditionLogic}"]`);
        if (logicRadio) logicRadio.checked = true;
        
        // Set actions
        if (template.rule.actions && template.rule.actions.length > 0) {
            const action = template.rule.actions[0];
            document.getElementById('action-endpoint').value = action.endpoint || '';
            
            // Set field checkboxes
            if (action.fields) {
                document.querySelectorAll('#field-selector input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = action.fields.includes(checkbox.value);
                });
            }
        }
        
        // Set block default
        document.getElementById('block-default').checked = template.rule.blockDefault || false;
        
        this.showNotification(`Template "${templateName}" loaded!`, 'success');
    }

    populateConditions(conditions) {
        if (!conditions || conditions.length === 0) return;
        
        // Clear existing conditions
        const container = document.getElementById('conditions-container');
        const conditionGroups = container.querySelectorAll('.condition-group');
        conditionGroups.forEach((group, index) => {
            if (index > 0) group.remove();
        });
        
        // Populate first condition
        const firstGroup = container.querySelector('.condition-group');
        this.populateConditionGroup(firstGroup, conditions[0]);
        
        // Add additional conditions
        for (let i = 1; i < conditions.length; i++) {
            this.addCondition();
            const groups = container.querySelectorAll('.condition-group');
            this.populateConditionGroup(groups[i], conditions[i]);
        }
    }

    populateConditionGroup(group, condition) {
        const fieldSelect = group.querySelector('.condition-field');
        const operatorSelect = group.querySelector('.condition-operator');
        const valueInput = group.querySelector('.condition-value');
        const typeSelect = group.querySelector('.condition-type');
        
        fieldSelect.value = condition.field || '';
        operatorSelect.value = condition.operator || '';
        valueInput.value = condition.value || '';
        typeSelect.value = condition.dataType || 'string';
    }

    addCondition() {
        const container = document.getElementById('conditions-container');
        const addButton = container.querySelector('button');
        
        const newConditionGroup = document.createElement('div');
        newConditionGroup.className = 'condition-group';
        newConditionGroup.innerHTML = `
            <div class="condition-row">
                <select class="form-control condition-field">
                    <option value="">Select Field</option>
                    <option value="type">Message Type</option>
                    <option value="hasGift">Has Gift</option>
                    <option value="price">Gift Price</option>
                    <option value="name">User Name</option>
                    <option value="comment">Message Text</option>
                    <option value="userLevel">User Level (Bilibili)</option>
                    <option value="guardLevel">Guard Level (Bilibili)</option>
                    <option value="isVip">VIP Status (Bilibili)</option>
                    <option value="isMember">Member Status (YouTube)</option>
                    <option value="isModerator">Moderator Status</option>
                    <option value="giftName">Gift Name</option>
                </select>
                <select class="form-control condition-operator">
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="greater_than_or_equal">Greater Than or Equal</option>
                    <option value="less_than">Less Than</option>
                    <option value="less_than_or_equal">Less Than or Equal</option>
                    <option value="contains">Contains</option>
                    <option value="not_contains">Does Not Contain</option>
                    <option value="starts_with">Starts With</option>
                    <option value="ends_with">Ends With</option>
                    <option value="regex">Regular Expression</option>
                </select>
                <input type="text" class="form-control condition-value" placeholder="Value">
                <select class="form-control condition-type">
                    <option value="string">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">True/False</option>
                </select>
                <button type="button" class="btn btn-danger" onclick="removeCondition(this)">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.insertBefore(newConditionGroup, addButton);
    }

    removeCondition(button) {
        const conditionGroup = button.closest('.condition-group');
        const container = conditionGroup.parentElement;
        
        // Don't allow removing the last condition
        if (container.querySelectorAll('.condition-group').length > 1) {
            conditionGroup.remove();
        } else {
            this.showNotification('At least one condition is required', 'warning');
        }
    }

    async saveRule() {
        try {
            const rule = this.buildRuleFromForm();
            
            const response = await fetch('/api/rules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(rule)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Rule saved successfully!', 'success');
                this.clearForm();
                await this.refreshRules();
                this.switchTab('rules');
            } else {
                throw new Error(result.error || 'Failed to save rule');
            }
        } catch (error) {
            console.error('Failed to save rule:', error);
            this.showNotification('Failed to save rule: ' + error.message, 'error');
        }
    }

    buildRuleFromForm() {
        const name = document.getElementById('rule-name').value.trim();
        const description = document.getElementById('rule-description').value.trim();
        const endpoint = document.getElementById('action-endpoint').value.trim();
        const blockDefault = document.getElementById('block-default').checked;
        const conditionLogic = document.querySelector('input[name="condition-logic"]:checked').value;
        
        // Build conditions
        const conditions = [];
        document.querySelectorAll('.condition-group').forEach(group => {
            const field = group.querySelector('.condition-field').value;
            const operator = group.querySelector('.condition-operator').value;
            const value = group.querySelector('.condition-value').value;
            const dataType = group.querySelector('.condition-type').value;
            
            if (field && operator) {
                let processedValue = value;
                if (dataType === 'number') {
                    processedValue = parseFloat(value) || 0;
                } else if (dataType === 'boolean') {
                    processedValue = value.toLowerCase() === 'true' || value === '1';
                }
                
                conditions.push({
                    field,
                    operator,
                    value: processedValue,
                    dataType
                });
            }
        });
        
        // Build selected fields
        const selectedFields = [];
        document.querySelectorAll('#field-selector input[type="checkbox"]:checked').forEach(checkbox => {
            selectedFields.push(checkbox.value);
        });
        
        return {
            name,
            description,
            conditions,
            conditionLogic,
            actions: [{
                type: 'route_to_endpoint',
                endpoint,
                fields: selectedFields
            }],
            enabled: true,
            blockDefault
        };
    }

    clearForm() {
        document.getElementById('rule-form').reset();
        
        // Reset conditions to just one
        const container = document.getElementById('conditions-container');
        const conditionGroups = container.querySelectorAll('.condition-group');
        conditionGroups.forEach((group, index) => {
            if (index > 0) group.remove();
        });
        
        // Clear the first condition
        const firstGroup = container.querySelector('.condition-group');
        firstGroup.querySelector('.condition-field').value = '';
        firstGroup.querySelector('.condition-operator').value = 'equals';
        firstGroup.querySelector('.condition-value').value = '';
        firstGroup.querySelector('.condition-type').value = 'string';
        
        // Reset checkboxes
        document.getElementById('field-name').checked = true;
        document.getElementById('field-comment').checked = true;
        document.querySelectorAll('#field-selector input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.id !== 'field-name' && checkbox.id !== 'field-comment') {
                checkbox.checked = false;
            }
        });
    }

    async toggleRule(ruleId, enabled) {
        try {
            const response = await fetch(`/api/rules/${ruleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ enabled })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Rule ${enabled ? 'enabled' : 'disabled'}`, 'success');
                await this.refreshRules();
            } else {
                throw new Error(result.error || 'Failed to toggle rule');
            }
        } catch (error) {
            console.error('Failed to toggle rule:', error);
            this.showNotification('Failed to toggle rule: ' + error.message, 'error');
        }
    }

    async deleteRule(ruleId) {
        if (!confirm('Are you sure you want to delete this rule?')) return;
        
        try {
            const response = await fetch(`/api/rules/${ruleId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Rule deleted successfully', 'success');
                await this.refreshRules();
            } else {
                throw new Error(result.error || 'Failed to delete rule');
            }
        } catch (error) {
            console.error('Failed to delete rule:', error);
            this.showNotification('Failed to delete rule: ' + error.message, 'error');
        }
    }

    editRule(ruleId) {
        const rule = this.rules.find(r => r.id === ruleId);
        if (!rule) return;
        
        // For now, switch to create tab and populate form
        // In a full implementation, you'd want a separate edit modal
        this.switchTab('create');
        this.populateFormWithRule(rule);
    }

    populateFormWithRule(rule) {
        document.getElementById('rule-name').value = rule.name || '';
        document.getElementById('rule-description').value = rule.description || '';
        
        if (rule.conditions) {
            this.populateConditions(rule.conditions);
        }
        
        const logicRadio = document.querySelector(`input[name="condition-logic"][value="${rule.conditionLogic || 'AND'}"]`);
        if (logicRadio) logicRadio.checked = true;
        
        if (rule.actions && rule.actions.length > 0) {
            const action = rule.actions[0];
            document.getElementById('action-endpoint').value = action.endpoint || '';
            
            if (action.fields) {
                document.querySelectorAll('#field-selector input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = action.fields.includes(checkbox.value);
                });
            }
        }
        
        document.getElementById('block-default').checked = rule.blockDefault || false;
    }

    async testRules() {
        try {
            const messageText = document.getElementById('test-message').value.trim();
            if (!messageText) {
                this.showNotification('Please enter a test message', 'warning');
                return;
            }
            
            const testMessage = JSON.parse(messageText);
            const resultsContainer = document.getElementById('test-results');
            
            resultsContainer.innerHTML = '<div style="text-align: center;"><i class="fas fa-spinner fa-spin"></i> Testing rules...</div>';
            
            // Test against each rule
            const results = [];
            for (const rule of this.rules) {
                if (!rule.enabled) continue;
                
                const response = await fetch('/api/rules/test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ rule, testMessage })
                });
                
                const result = await response.json();
                results.push({
                    rule: rule.name,
                    matches: result.matches,
                    actions: rule.actions || []
                });
            }
            
            // Display results
            let html = '<h4>Test Results:</h4>';
            
            const matchingRules = results.filter(r => r.matches);
            const nonMatchingRules = results.filter(r => !r.matches);
            
            if (matchingRules.length > 0) {
                html += '<div style="color: #38a169; margin: 10px 0;"><strong>✅ Matching Rules:</strong></div>';
                matchingRules.forEach(result => {
                    html += `
                        <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 4px; padding: 10px; margin: 5px 0;">
                            <strong>${result.rule}</strong><br>
                            <small>Actions: ${result.actions.map(a => a.type).join(', ') || 'None'}</small>
                        </div>
                    `;
                });
            }
            
            if (nonMatchingRules.length > 0) {
                html += '<div style="color: #718096; margin: 10px 0;"><strong>❌ Non-matching Rules:</strong></div>';
                nonMatchingRules.forEach(result => {
                    html += `
                        <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 10px; margin: 5px 0;">
                            <strong>${result.rule}</strong><br>
                            <small style="color: #718096;">No match</small>
                        </div>
                    `;
                });
            }
            
            if (results.length === 0) {
                html += '<div style="color: #718096; text-align: center; padding: 20px;">No active rules to test against.</div>';
            }
            
            resultsContainer.innerHTML = html;
            
        } catch (error) {
            console.error('Test failed:', error);
            document.getElementById('test-results').innerHTML = `
                <div style="color: #e53e3e; background: #fed7d7; border: 1px solid #feb2b2; border-radius: 4px; padding: 10px;">
                    <strong>Test Error:</strong> ${error.message}
                </div>
            `;
        }
    }

    closeEditModal() {
        document.getElementById('edit-modal').classList.remove('show');
    }

    async loadConfigurationUI() {
        try {
            const response = await fetch('/api/config');
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('osc-host').value = data.config.oscHost;
                document.getElementById('osc-port').value = data.config.oscPort;
                document.getElementById('enable-default-endpoints').checked = data.config.enableDefaultEndpoints !== false;
                document.getElementById('current-osc-target').textContent = `${data.config.oscHost}:${data.config.oscPort}`;
            }
        } catch (error) {
            console.error('Failed to load configuration:', error);
            this.showNotification('Failed to load configuration', 'error');
        }
    }

    async saveConfiguration() {
        try {
            const oscHost = document.getElementById('osc-host').value.trim() || '127.0.0.1';
            const oscPort = parseInt(document.getElementById('osc-port').value) || 19100;
            
            if (oscPort < 1024 || oscPort > 65535) {
                this.showNotification('OSC Port must be between 1024 and 65535', 'warning');
                return;
            }
            
            const response = await fetch('/api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ oscHost, oscPort })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Configuration saved successfully!', 'success');
                document.getElementById('current-osc-target').textContent = `${result.config.oscHost}:${result.config.oscPort}`;
                
                // Show status message
                const statusDiv = document.getElementById('config-status');
                statusDiv.style.display = 'block';
                statusDiv.style.background = '#e6fffa';
                statusDiv.style.border = '1px solid #38b2ac';
                statusDiv.style.color = '#38b2ac';
                statusDiv.innerHTML = `
                    <i class="fas fa-check-circle"></i> 
                    Configuration updated! OSC messages will now be sent to ${result.config.oscHost}:${result.config.oscPort}
                `;
                
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 5000);
            } else {
                throw new Error(result.error || 'Failed to save configuration');
            }
        } catch (error) {
            console.error('Failed to save configuration:', error);
            this.showNotification('Failed to save configuration: ' + error.message, 'error');
        }
    }
    
    async loadConfiguration() {
        await this.loadConfigurationUI();
        this.showNotification('Configuration reloaded', 'success');
    }
    
    async testOscConnection() {
        const oscHost = document.getElementById('osc-host').value.trim() || '127.0.0.1';
        const oscPort = parseInt(document.getElementById('osc-port').value) || 19100;
        
        if (oscPort < 1024 || oscPort > 65535) {
            this.showNotification('OSC Port must be between 1024 and 65535', 'warning');
            return;
        }
        
        this.showNotification(`Sending test OSC messages to ${oscHost}:${oscPort}...`, 'info');
        
        try {
            const response = await fetch('/api/osc/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ oscHost, oscPort })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const statusDiv = document.getElementById('config-status');
                statusDiv.style.display = 'block';
                statusDiv.style.background = '#e6fffa';
                statusDiv.style.border = '1px solid #38b2ac';
                statusDiv.style.color = '#38b2ac';
                statusDiv.innerHTML = `
                    <i class="fas fa-check-circle"></i> 
                    <strong>Test OSC messages sent successfully!</strong><br>
                    Target: ${result.target}<br>
                    Time: ${new Date(result.timestamp).toLocaleString()}<br>
                    <small>
                        Sent test messages to endpoints:<br>
                        • /onecomme/test<br>
                        • /onecomme/connection-test<br>
                        • /test/osc-router<br>
                        • /onecomme/test/ping<br>
                        <br>
                        Check your OSC receiver application for incoming messages.
                    </small>
                `;
                
                this.showNotification(`Test messages sent to ${result.target}`, 'success');
                
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 15000);
            } else {
                throw new Error(result.error || 'Test failed');
            }
        } catch (error) {
            console.error('OSC test failed:', error);
            
            const statusDiv = document.getElementById('config-status');
            statusDiv.style.display = 'block';
            statusDiv.style.background = '#fed7d7';
            statusDiv.style.border = '1px solid #feb2b2';
            statusDiv.style.color = '#e53e3e';
            statusDiv.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                <strong>OSC Test Failed</strong><br>
                Error: ${error.message}<br>
                <small>
                    This could mean:<br>
                    • Invalid host/port configuration<br>
                    • Network connectivity issues<br>
                    • Plugin internal error<br>
                </small>
            `;
            
            this.showNotification(`OSC test failed: ${error.message}`, 'error');
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 10000);
        }
    }
    
    async saveDefaultEndpointsSetting() {
        try {
            const enableDefaultEndpoints = document.getElementById('enable-default-endpoints').checked;
            
            const response = await fetch('/api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    enableDefaultEndpoints: enableDefaultEndpoints
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const status = enableDefaultEndpoints ? 'enabled' : 'disabled';
                this.showNotification(`Default endpoints ${status} successfully!`, 'success');
                
                // Show status message
                const statusDiv = document.getElementById('config-status');
                statusDiv.style.display = 'block';
                statusDiv.style.background = enableDefaultEndpoints ? '#e6fffa' : '#fed7d7';
                statusDiv.style.border = enableDefaultEndpoints ? '1px solid #38b2ac' : '1px solid #feb2b2';
                statusDiv.style.color = enableDefaultEndpoints ? '#38b2ac' : '#e53e3e';
                statusDiv.innerHTML = `
                    <i class="fas fa-${enableDefaultEndpoints ? 'check-circle' : 'exclamation-triangle'}"></i> 
                    <strong>Default Endpoints ${enableDefaultEndpoints ? 'Enabled' : 'Disabled'}</strong><br>
                    ${enableDefaultEndpoints 
                        ? 'Messages will be sent to both default endpoints and custom routing rules.' 
                        : '<strong>Warning:</strong> Only custom routing rules will send OSC messages. Default endpoints are disabled.'}
                `;
                
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 8000);
            } else {
                throw new Error(result.error || 'Failed to save default endpoints setting');
            }
            
        } catch (error) {
            console.error('Failed to save default endpoints setting:', error);
            this.showNotification('Failed to save setting: ' + error.message, 'error');
        }
    }
    
    async exportConfiguration() {
        try {
            const [rulesResponse, configResponse] = await Promise.all([
                fetch('/api/rules'),
                fetch('/api/config')
            ]);
            
            const rulesData = await rulesResponse.json();
            const configData = await configResponse.json();
            
            const exportData = {
                version: '2.0.0',
                exportedAt: new Date().toISOString(),
                rules: rulesData.rules || [],
                config: configData.config || {}
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `onecomme-osc-router-config-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            this.showNotification('Configuration exported successfully!', 'success');
        } catch (error) {
            console.error('Failed to export configuration:', error);
            this.showNotification('Failed to export configuration: ' + error.message, 'error');
        }
    }
    
    async importConfiguration(fileInput) {
        const file = fileInput.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const importData = JSON.parse(text);
            
            if (!importData.rules && !importData.config) {
                throw new Error('Invalid configuration file format');
            }
            
            // Import configuration
            if (importData.config) {
                const response = await fetch('/api/config', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(importData.config)
                });
                
                if (!response.ok) {
                    throw new Error('Failed to import configuration');
                }
            }
            
            // Import rules
            if (importData.rules && importData.rules.length > 0) {
                for (const rule of importData.rules) {
                    await fetch('/api/rules', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(rule)
                    });
                }
            }
            
            this.showNotification(`Configuration imported successfully! Imported ${importData.rules?.length || 0} rules.`, 'success');
            
            // Refresh UI
            await this.loadConfigurationUI();
            await this.refreshRules();
            
        } catch (error) {
            console.error('Failed to import configuration:', error);
            this.showNotification('Failed to import configuration: ' + error.message, 'error');
        } finally {
            // Reset file input
            fileInput.value = '';
        }
    }

    async loadLogs() {
        try {
            const response = await fetch('/api/logs');
            const data = await response.json();
            
            if (data.success) {
                this.renderLogs(data.messages);
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
            this.showNotification('Failed to load logs', 'error');
        }
    }

    renderLogs(messages) {
        const incomingContainer = document.getElementById('incoming-messages');
        const outgoingContainer = document.getElementById('outgoing-messages');
        const incomingCount = document.getElementById('incoming-count');
        const outgoingCount = document.getElementById('outgoing-count');
        
        const incomingMessages = messages.filter(m => m.type === 'incoming');
        const outgoingMessages = messages.filter(m => m.type === 'outgoing');
        
        incomingCount.textContent = incomingMessages.length;
        outgoingCount.textContent = outgoingMessages.length;
        
        // Preserve expanded JSON state before re-rendering
        const expandedJsonIds = this.getExpandedJsonIds();
        
        // Render incoming messages (newest first - server already provides them in correct order)
        if (incomingMessages.length === 0) {
            incomingContainer.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-inbox" style="font-size: 48px; color: #ccc; margin-bottom: 10px;"></i>
                    <p style="color: #999;">No incoming messages yet...</p>
                    <small style="color: #ccc;">OneComme messages will appear here</small>
                </div>
            `;
        } else {
            incomingContainer.innerHTML = incomingMessages.map(msg => this.renderIncomingMessage(msg)).join('');
        }
        
        // Render outgoing messages (newest first - server already provides them in correct order)
        if (outgoingMessages.length === 0) {
            outgoingContainer.innerHTML = `
                <div class="no-messages">
                    <i class="fas fa-paper-plane" style="font-size: 48px; color: #ccc; margin-bottom: 10px;"></i>
                    <p style="color: #999;">No outgoing messages yet...</p>
                    <small style="color: #ccc;">OSC messages will appear here</small>
                </div>
            `;
        } else {
            outgoingContainer.innerHTML = outgoingMessages.map(msg => this.renderOutgoingMessage(msg)).join('');
        }
        
        // Restore expanded JSON state after re-rendering
        this.restoreExpandedJsonIds(expandedJsonIds);
    }

    buildIncomingReadableContent(data, service) {
        let hasContent = false;
        let content = '<div class="readable-fields">';
        
        // Gift Information (if present)
        if (data.hasGift) {
            hasContent = true;
            content += '<div class="field-group gift-group">';
            content += '<div class="field-group-title"><i class="fas fa-gift"></i> Gift Information</div>';
            content += '<div class="gift-info-table">';
            content += '<div class="gift-info-row">';
            
            if (data.giftName) {
                content += `<span class="gift-name-primary">${data.giftName}</span>`;
            }
            
            if (data.price !== undefined) {
                const priceColor = data.price >= 50 ? '#e74c3c' : data.price >= 10 ? '#f39c12' : '#27ae60';
                const currency = service === 'bilibili' ? '¥' : '$';
                content += `<span class="gift-price-primary" style="color: ${priceColor}; font-weight: bold; margin-left: 10px;">${currency}${data.price}</span>`;
            }
            
            content += '</div>';
            content += '</div>';
            content += '</div>';
        }
        
        content += '</div>';
        
        // Return null if no content to display
        return hasContent ? content : null;
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp || typeof timestamp !== 'object') return 'N/A';
        
        const { year, month, day, hour, minute, second } = timestamp;
        if (!year || !month || !day) return 'Invalid timestamp';
        
        return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')} ${hour || 0}:${(minute || 0).toString().padStart(2, '0')}:${(second || 0).toString().padStart(2, '0')}`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getExpandedJsonIds() {
        // Get all JSON elements that are currently expanded
        const expandedIds = [];
        const jsonElements = document.querySelectorAll('.log-json');
        
        jsonElements.forEach(element => {
            if (element.style.display === 'block') {
                // Extract the message ID from the element ID (format: 'json-{messageId}')
                const messageId = element.id.replace('json-', '');
                expandedIds.push(messageId);
            }
        });
        
        return expandedIds;
    }
    
    restoreExpandedJsonIds(expandedIds) {
        // Restore the expanded state for JSON elements
        expandedIds.forEach(messageId => {
            const jsonElement = document.getElementById(`json-${messageId}`);
            if (jsonElement) {
                const toggleElement = jsonElement.previousElementSibling;
                jsonElement.style.display = 'block';
                if (toggleElement) {
                    toggleElement.innerHTML = '<i class="fas fa-eye-slash"></i> Click to hide raw Data';
                }
            }
        });
    }

    renderIncomingMessage(msg) {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const statusIcon = msg.processed ? '✅' : '❌';
        const userName = msg.data.name || 'Unknown';
        const userComment = msg.data.comment || 'No message';
        const hasGift = msg.data.hasGift ? ' 🎁' : '';
        
        // Build member status badges for header
        let memberBadges = [];
        if (msg.service === 'bilibili') {
            if (msg.data.userLevel) {
                const levelColor = msg.data.userLevel >= 20 ? '#f39c12' : msg.data.userLevel >= 10 ? '#e74c3c' : '#95a5a6';
                memberBadges.push(`<span class="user-badge level-badge" style="background-color: ${levelColor};">UL${msg.data.userLevel}</span>`);
            }
            if (msg.data.guardLevel > 0) {
                const guardTypes = { 1: '总督', 2: '提督', 3: '舰长' };
                memberBadges.push(`<span class="user-badge guard-badge">${guardTypes[msg.data.guardLevel] || 'Guard'}</span>`);
            }
            if (msg.data.isVip) {
                memberBadges.push(`<span class="user-badge vip-badge">VIP</span>`);
            }
            if (msg.data.isSvip) {
                memberBadges.push(`<span class="user-badge svip-badge">SVIP</span>`);
            }
        }
        
        if (msg.service === 'youtube') {
            if (msg.data.isMember) {
                memberBadges.push(`<span class="user-badge member-badge">Member</span>`);
            }
            if (msg.data.isModerator) {
                memberBadges.push(`<span class="user-badge mod-badge">Moderator</span>`);
            }
        }
        
        const badgeHtml = memberBadges.length > 0 ? memberBadges.join('') : '';
        
        // Build human-readable display
        const readableContent = this.buildIncomingReadableContent(msg.data, msg.service);
        
        return `
            <div class="log-message incoming ${msg.processed ? 'success' : 'error'}">
                <div class="log-header">
                    <div class="log-title">
                        ${statusIcon}
                        <span class="log-service ${msg.service}">${msg.service}</span>
                        ${badgeHtml}
                        <strong>${userName}</strong>${hasGift}
                    </div>
                    <div class="log-time">${time}</div>
                </div>
                <div class="log-content">
                    "${userComment.substring(0, 150)}${userComment.length > 150 ? '...' : ''}"
                </div>
                ${readableContent ? `<div class="log-readable-content">${readableContent}</div>` : ''}
                <div class="log-toggle" onclick="toggleLogJson('${msg.id}')">
                    <i class="fas fa-code"></i> Click to view raw Data
                </div>
                <div class="log-json" id="json-${msg.id}">${JSON.stringify(msg.data, null, 2)}</div>
            </div>
        `;
    }

    buildOutgoingReadableContent(data, endpoint) {
        let content = '<div class="readable-fields">';
        
        // Message Content as clear table
        content += '<div class="field-group">';
        content += '<div class="field-group-title"><i class="fas fa-table"></i> OSC Message Fields</div>';
        
        if (typeof data === 'string') {
            // OSC string data - try to parse as JSON to show the actual message fields
            let jsonData = null;
            let parseError = null;
            
            try {
                // First attempt: direct parse
                jsonData = JSON.parse(data);
            } catch (e1) {
                try {
                    // Second attempt: trim whitespace and try again
                    jsonData = JSON.parse(data.trim());
                } catch (e2) {
                    try {
                        // Third attempt: handle potential encoding issues
                        const cleanData = data.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
                        jsonData = JSON.parse(cleanData);
                    } catch (e3) {
                        parseError = e3;
                    }
                }
            }
            
            if (jsonData && typeof jsonData === 'object') {
                // Successfully parsed JSON
                content += '<table class="message-data-table">';
                
                // Display each field that's being sent in the OSC message
                for (const [key, value] of Object.entries(jsonData)) {
                    let displayValue = value;
                    let valueClass = 'data-value';
                    
                    // Format different types appropriately
                    if (typeof value === 'string') {
                        displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
                        displayValue = `"${this.escapeHtml(displayValue)}"`;
                    } else if (typeof value === 'number') {
                        displayValue = value;
                        valueClass += ' number-value';
                    } else if (typeof value === 'boolean') {
                        displayValue = value ? 'true' : 'false';
                        valueClass += value ? ' boolean-true' : ' boolean-false';
                    } else if (value === null) {
                        displayValue = 'null';
                        valueClass += ' null-value';
                    } else if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                        if (displayValue.length > 100) {
                            displayValue = displayValue.substring(0, 100) + '...';
                        }
                        displayValue = this.escapeHtml(displayValue);
                        valueClass += ' object-value';
                    }
                    
                    content += `<tr><td class="data-key">${this.escapeHtml(key)}</td><td class="${valueClass}">${displayValue}</td></tr>`;
                }
                
                content += '</table>';
                
                const fieldCount = Object.keys(jsonData).length;
                content += `<div class="content-meta">Fields sent: ${fieldCount} | Message size: ${data.length} bytes</div>`;
                
            } else {
                // Fallback if string is not JSON - show as raw string
                content += '<table class="message-data-table">';
                content += '<tr><td class="data-key">Type</td><td class="data-value">Raw String</td></tr>';
                content += `<tr><td class="data-key">Content</td><td class="data-value">${this.escapeHtml(data)}</td></tr>`;
                content += `<tr><td class="data-key">Length</td><td class="data-value">${data.length} characters</td></tr>`;
                if (parseError) {
                    content += `<tr><td class="data-key">Parse Error</td><td class="data-value error-content">${this.escapeHtml(parseError.message)}</td></tr>`;
                }
                content += '</table>';
            }
        } else {
            // Object data (shouldn't happen for OSC messages, but handle just in case)
            content += '<table class="message-data-table">';
            
            // Display each field in the table
            for (const [key, value] of Object.entries(data)) {
                let displayValue = value;
                let valueClass = 'data-value';
                
                // Format different types appropriately
                if (typeof value === 'string') {
                    displayValue = value.length > 100 ? value.substring(0, 100) + '...' : value;
                    displayValue = `"${this.escapeHtml(displayValue)}"`;
                } else if (typeof value === 'number') {
                    displayValue = value;
                    valueClass += ' number-value';
                } else if (typeof value === 'boolean') {
                    displayValue = value ? 'true' : 'false';
                    valueClass += value ? ' boolean-true' : ' boolean-false';
                } else if (value === null) {
                    displayValue = 'null';
                    valueClass += ' null-value';
                } else if (typeof value === 'object') {
                    displayValue = JSON.stringify(value);
                    if (displayValue.length > 100) {
                        displayValue = displayValue.substring(0, 100) + '...';
                    }
                    displayValue = this.escapeHtml(displayValue);
                    valueClass += ' object-value';
                }
                
                content += `<tr><td class="data-key">${this.escapeHtml(key)}</td><td class="${valueClass}">${displayValue}</td></tr>`;
            }
            
            content += '</table>';
            
            const jsonSize = JSON.stringify(data).length;
            content += `<div class="content-meta">Total Size: ${jsonSize} bytes | Fields: ${Object.keys(data).length}</div>`;
        }
        
        content += '</div>';
        content += '</div>';
        return content;
    }
    
    categorizeEndpoint(endpoint) {
        if (endpoint.includes('/youtube')) return 'youtube';
        if (endpoint.includes('/bilibili')) return 'bilibili';
        if (endpoint.includes('/niconama') || endpoint.includes('/niconico')) return 'niconico';
        if (endpoint.includes('/test')) return 'test';
        return 'unknown';
    }
    
    buildJsonDataReadable(jsonData) {
        let content = '<div class="field-group">';
        content += '<div class="field-group-title"><i class="fas fa-database"></i> Message Data</div>';
        
        // Extract key information from JSON
        if (jsonData.name) {
            content += `<div class="field-item"><span class="field-label">User:</span> <span class="field-value user-name">${jsonData.name}</span></div>`;
        }
        
        if (jsonData.comment) {
            const comment = jsonData.comment.length > 80 ? jsonData.comment.substring(0, 80) + '...' : jsonData.comment;
            content += `<div class="field-item"><span class="field-label">Message:</span> <span class="field-value message-text">"${comment}"</span></div>`;
        }
        
        if (jsonData.hasGift || jsonData.price || jsonData.giftName) {
            content += `<div class="field-item"><span class="field-label">Gift:</span>`;
            
            if (jsonData.giftName) {
                content += ` <span class="field-value gift-name">${jsonData.giftName}</span>`;
            }
            
            if (jsonData.price) {
                const priceColor = jsonData.price >= 50 ? '#e74c3c' : jsonData.price >= 10 ? '#f39c12' : '#27ae60';
                content += ` <span class="field-value price-value" style="color: ${priceColor}; font-weight: bold;">($${jsonData.price})</span>`;
            }
            
            content += `</div>`;
        }
        
        // Platform-specific fields
        if (jsonData.userLevel) {
            const levelColor = jsonData.userLevel >= 20 ? '#f39c12' : jsonData.userLevel >= 10 ? '#e74c3c' : '#95a5a6';
            content += `<div class="field-item"><span class="field-label">Level:</span> <span class="field-value" style="color: ${levelColor}; font-weight: bold;">UL${jsonData.userLevel}</span></div>`;
        }
        
        if (jsonData.isMember || jsonData.isModerator || jsonData.isVip) {
            content += `<div class="field-item"><span class="field-label">Status:</span>`;
            
            if (jsonData.isMember) content += ` <span class="field-value member-badge">Member</span>`;
            if (jsonData.isModerator) content += ` <span class="field-value mod-badge">Moderator</span>`;
            if (jsonData.isVip) content += ` <span class="field-value vip-badge">VIP</span>`;
            
            content += `</div>`;
        }
        
        // Data size information
        const jsonString = JSON.stringify(jsonData);
        content += `<div class="field-item"><span class="field-label">Data Size:</span> <span class="field-value">${jsonString.length} bytes</span></div>`;
        
        const fieldCount = Object.keys(jsonData).length;
        content += `<div class="field-item"><span class="field-label">Fields:</span> <span class="field-value">${fieldCount} fields</span></div>`;
        
        content += '</div>';
        return content;
    }

    renderOutgoingMessage(msg) {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        const statusIcon = msg.success ? '✅' : '❌';
        const endpointParts = msg.endpoint.split('/');
        const endpointName = endpointParts[endpointParts.length - 1] || 'root';
        
        // Get platform source with same coloration as incoming messages
        const platformSource = this.categorizeEndpoint(msg.endpoint);
        let platformSpan = '';
        if (platformSource !== 'unknown') {
            platformSpan = `<span class="log-service ${platformSource}">${platformSource}</span>`;
        }
        
        // Build human-readable display for outgoing data
        const readableContent = this.buildOutgoingReadableContent(msg.data, msg.endpoint);
        
        return `
            <div class="log-message outgoing ${msg.success ? 'success' : 'error'}">
                <div class="log-header">
                    <div class="log-title">
                        ${statusIcon}
                        <span class="log-endpoint">${msg.endpoint}</span>
                        ${platformSpan}
                        ${msg.error ? `<span style="color: #f56565; font-size: 12px;">(${msg.error})</span>` : ''}
                    </div>
                    <div class="log-time">${time}</div>
                </div>
                <div class="log-readable-content">
                    ${readableContent}
                </div>
                <div class="log-toggle" onclick="toggleLogJson('${msg.id}')">
                    <i class="fas fa-code"></i> Click to view raw Data
                </div>
                <div class="log-json" id="json-${msg.id}">${typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data, null, 2)}</div>
            </div>
        `;
    }

    async clearLogs() {
        try {
            const response = await fetch('/api/logs', {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Logs cleared successfully', 'success');
                this.loadLogs();
            } else {
                throw new Error(result.error || 'Failed to clear logs');
            }
        } catch (error) {
            console.error('Failed to clear logs:', error);
            this.showNotification('Failed to clear logs: ' + error.message, 'error');
        }
    }

    startLogAutoRefresh() {
        // Auto-refresh logs every 2 seconds when on logs tab
        if (this.logRefreshInterval) {
            clearInterval(this.logRefreshInterval);
        }
        
        this.logRefreshInterval = setInterval(() => {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab && activeTab.id === 'logs-tab') {
                this.loadLogs();
            }
        }, 2000);
    }

    stopLogAutoRefresh() {
        if (this.logRefreshInterval) {
            clearInterval(this.logRefreshInterval);
            this.logRefreshInterval = null;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 600;
            z-index: 2000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;
        
        // Set background color based on type
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        
        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Add CSS animation if not exists
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Global functions for HTML onclick handlers
let app;

function switchTab(tabName) {
    app.switchTab(tabName);
}

function refreshRules() {
    app.refreshRules();
}

function addCondition() {
    app.addCondition();
}

function removeCondition(button) {
    app.removeCondition(button);
}

function clearForm() {
    app.clearForm();
}

function testRules() {
    app.testRules();
}

function closeEditModal() {
    app.closeEditModal();
}

function saveConfiguration() {
    app.saveConfiguration();
}

function loadConfiguration() {
    app.loadConfiguration();
}

function testOscConnection() {
    app.testOscConnection();
}

function exportConfiguration() {
    app.exportConfiguration();
}

function importConfiguration(fileInput) {
    app.importConfiguration(fileInput);
}

function saveDefaultEndpointsSetting() {
    app.saveDefaultEndpointsSetting();
}

function refreshLogs() {
    app.loadLogs();
}

function clearLogs() {
    app.clearLogs();
}

function toggleLogJson(messageId) {
    const jsonElement = document.getElementById(`json-${messageId}`);
    const toggleElement = jsonElement.previousElementSibling;
    
    if (jsonElement.style.display === 'none' || !jsonElement.style.display) {
        jsonElement.style.display = 'block';
        toggleElement.innerHTML = '<i class="fas fa-eye-slash"></i> Click to hide raw Data';
    } else {
        jsonElement.style.display = 'none';
        toggleElement.innerHTML = '<i class="fas fa-code"></i> Click to view raw Data';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    app = new RoutingUI();
});
