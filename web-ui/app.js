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

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    app = new RoutingUI();
});