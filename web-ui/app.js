// OneComme OSC Conditional Routing Web UI
class RoutingUI {
    constructor() {
        this.rules = [];
        this.templates = [];
        this.uiPreferences = {};
        this.configCache = {};
        this.init();
    }

    async init() {
        await this.loadUIPreferences();
        await this.restoreLastActiveTab();
        await this.loadRules();
        await this.loadTemplates();
        this.setupEventListeners();
        this.setupUIPreferenceHandlers();
        this.renderRules();
        this.renderTemplates();
        this.startLogAutoRefresh();
        
        // Save UI preferences periodically
        this.startPreferencesSaver();
    }
    
    async loadUIPreferences() {
        try {
            const response = await fetch('/api/config/ui');
            const data = await response.json();
            this.uiPreferences = data.ui || {};
            console.info('🎨 UI preferences loaded:', this.uiPreferences);
        } catch (error) {
            console.warn('Failed to load UI preferences:', error);
            this.uiPreferences = {};
        }
    }
    
    async saveUIPreference(key, value) {
        try {
            this.uiPreferences[key] = value;
            
            const response = await fetch('/api/config/ui', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ [key]: value })
            });
            
            if (response.ok) {
                console.debug(`💾 UI preference saved: ${key} = ${value}`);
            }
        } catch (error) {
            console.warn('Failed to save UI preference:', error);
        }
    }
    
    async restoreLastActiveTab() {
        const lastTab = this.uiPreferences.lastActiveTab || 'overview';
        // Wait a moment for DOM to be ready
        setTimeout(() => {
            this.switchTab(lastTab);
        }, 100);
    }
    
    startPreferencesSaver() {
        // Auto-save preferences every 30 seconds if there are changes
        setInterval(() => {
            if (this.hasUnsavedPreferences) {
                this.batchSavePreferences();
            }
        }, 30000);
    }
    
    async batchSavePreferences() {
        try {
            const response = await fetch('/api/config/ui', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.uiPreferences)
            });
            
            if (response.ok) {
                console.debug('💾 UI preferences batch saved');
                this.hasUnsavedPreferences = false;
            }
        } catch (error) {
            console.warn('Failed to batch save UI preferences:', error);
        }
    }
    
    setupUIPreferenceHandlers() {
        // Track notification preferences
        const notificationSettings = document.querySelectorAll('[data-preference]');
        notificationSettings.forEach(element => {
            element.addEventListener('change', (e) => {
                const preference = e.target.dataset.preference;
                const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                this.saveUIPreference(preference, value);
            });
        });
        
        // Track form field changes for auto-save
        this.setupFormAutoSave();
    }
    
    setupFormAutoSave() {
        // Auto-save form data when user stops typing
        const formInputs = document.querySelectorAll('#rule-form input, #rule-form textarea, #rule-form select');
        formInputs.forEach(input => {
            let timeoutId;
            
            input.addEventListener('input', () => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    this.saveFormDraft();
                }, 2000); // Save 2 seconds after user stops typing
            });
        });
    }
    
    saveFormDraft() {
        const formData = new FormData(document.getElementById('rule-form'));
        const draftData = {};
        for (let [key, value] of formData.entries()) {
            draftData[key] = value;
        }
        
        this.saveUIPreference('formDraft', draftData);
        console.debug('💾 Form draft saved');
    }
    
    restoreFormDraft() {
        const draft = this.uiPreferences.formDraft;
        if (!draft) return;
        
        try {
            for (const [key, value] of Object.entries(draft)) {
                const element = document.getElementById(key);
                if (element) {
                    element.value = value;
                }
            }
            console.debug('📄 Form draft restored');
        } catch (error) {
            console.warn('Failed to restore form draft:', error);
        }
    }
    
    clearFormDraft() {
        this.saveUIPreference('formDraft', null);
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
        // Save the active tab preference
        this.saveUIPreference('lastActiveTab', tabName);
        
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Add active class to selected tab and content
        document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load data for specific tabs
        if (tabName === 'rules') {
            this.refreshRules();
        } else if (tabName === 'create') {
            this.initializeCreateRuleTab();
            this.restoreFormDraft(); // Restore form draft when switching to create tab
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
        
        // Check if we have condition groups (new format) or fall back to legacy
        const conditionGroupsContainer = document.getElementById('condition-groups-container');
        const conditionGroups = conditionGroupsContainer.querySelectorAll('.condition-group-card');
        
        if (conditionGroups.length > 0) {
            // New enhanced format with condition groups
            const groupLogic = document.querySelector('input[name="group-logic"]:checked')?.value || 'OR';
            const conditionGroupsData = [];
            
            conditionGroups.forEach(groupCard => {
                const groupData = this.extractConditionGroup(groupCard);
                if (groupData) {
                    conditionGroupsData.push(groupData);
                }
            });
            
            // Build selected fields from dynamic field selector
            const selectedFields = [];
            const dynamicFieldCheckboxes = document.querySelectorAll('#dynamic-field-selector-content input[type="checkbox"]:checked');
            dynamicFieldCheckboxes.forEach(checkbox => {
                selectedFields.push(checkbox.value);
            });
            
            // Fallback to legacy field selector if no dynamic fields found
            if (selectedFields.length === 0) {
                document.querySelectorAll('#field-selector input[type="checkbox"]:checked').forEach(checkbox => {
                    selectedFields.push(checkbox.value);
                });
            }
            
            return {
                name,
                description,
                conditionGroups: conditionGroupsData,
                groupLogic,
                actions: [{
                    type: 'route_to_endpoint',
                    endpoint,
                    fields: selectedFields
                }],
                enabled: true,
                blockDefault
            };
        } else {
            // Legacy format fallback
            const conditionLogic = document.querySelector('input[name="condition-logic"]:checked')?.value || 'AND';
            
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
            
            // Build selected fields from dynamic field selector
            const selectedFields = [];
            const dynamicFieldCheckboxes = document.querySelectorAll('#dynamic-field-selector-content input[type="checkbox"]:checked');
            dynamicFieldCheckboxes.forEach(checkbox => {
                selectedFields.push(checkbox.value);
            });
            
            // Fallback to legacy field selector if no dynamic fields found
            if (selectedFields.length === 0) {
                document.querySelectorAll('#field-selector input[type="checkbox"]:checked').forEach(checkbox => {
                    selectedFields.push(checkbox.value);
                });
            }
            
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
    }

    // Enhanced Rule Builder Methods
    addConditionGroup() {
        const container = document.getElementById('condition-groups-container');
        const groupId = 'group-' + Date.now();
        
        const groupCard = document.createElement('div');
        groupCard.className = 'condition-group-card';
        groupCard.dataset.groupId = groupId;
        
        groupCard.innerHTML = this.generateConditionGroupHTML(groupId);
        container.appendChild(groupCard);
        
        // Show group logic selector if more than one group
        this.updateGroupLogicVisibility();
        
        // Initialize the first source as selected
        const firstSource = groupCard.querySelector('.source-option input[type="radio"]');
        if (firstSource) {
            firstSource.checked = true;
            this.onSourceChange(firstSource.value, groupId);
        }
    }
    
    generateConditionGroupHTML(groupId) {
        const sources = SourceSchemaHelpers.getAllSources();
        
        return `
            <button type="button" class="group-remove-btn" onclick="app.removeConditionGroup('${groupId}')">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="condition-group-header">
                <h5 style="margin: 0;"><i class="fas fa-layer-group"></i> Condition Group</h5>
            </div>
            
            <div class="source-selector">
                <label style="font-weight: bold; margin-right: 10px;">Platform:</label>
                ${sources.map(source => {
                    const schema = SourceSchemas[source];
                    return `
                        <label class="source-option">
                            <input type="radio" name="source-${groupId}" value="${source}" onchange="app.onSourceChange('${source}', '${groupId}')">
                            <i class="${schema.icon} source-icon" style="color: ${schema.color};"></i>
                            ${schema.name}
                        </label>
                    `;
                }).join('')}
            </div>
            
            <div id="message-type-${groupId}" class="message-type-selector" style="display: none;">
                <label style="font-weight: bold;">Message Type:</label>
                <div class="message-type-options" id="message-type-options-${groupId}">
                    <!-- Message type options will be populated here -->
                </div>
            </div>
            
            <div id="conditions-${groupId}" class="conditions-list">
                <div class="empty-conditions">
                    <i class="fas fa-filter" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Select a platform to add conditions</p>
                </div>
            </div>
            
            <div id="group-summary-${groupId}" class="group-summary" style="display: none;"></div>
        `;
    }
    
    onSourceChange(source, groupId) {
        const schema = SourceSchemas[source];
        if (!schema) return;
        
        // Update message type selector
        const messageTypeContainer = document.getElementById(`message-type-${groupId}`);
        const messageTypeOptions = document.getElementById(`message-type-options-${groupId}`);
        
        if (schema.messageTypes && schema.messageTypes.length > 1) {
            messageTypeContainer.style.display = 'block';
            messageTypeOptions.innerHTML = schema.messageTypes.map(type => `
                <div class="message-type-option" onclick="app.onMessageTypeChange('${type}', '${groupId}')">
                    ${type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
            `).join('');
            
            // Select first message type by default
            const firstOption = messageTypeOptions.querySelector('.message-type-option');
            if (firstOption) {
                firstOption.classList.add('selected');
                this.onMessageTypeChange(schema.messageTypes[0], groupId);
            }
        } else {
            messageTypeContainer.style.display = 'none';
            this.updateConditionsForGroup(groupId, source, schema.messageTypes[0] || null);
        }
        
        this.updateGroupSummary(groupId);
        
        // Update dynamic field selector when sources change
        this.updateDynamicFieldSelector();
    }
    
    onMessageTypeChange(messageType, groupId) {
        // Update visual selection
        const options = document.querySelectorAll(`#message-type-options-${groupId} .message-type-option`);
        options.forEach(option => {
            option.classList.toggle('selected', option.textContent.toLowerCase().trim() === messageType);
        });
        
        // Get current source
        const sourceInput = document.querySelector(`input[name="source-${groupId}"]:checked`);
        if (sourceInput) {
            this.updateConditionsForGroup(groupId, sourceInput.value, messageType);
        }
        
        this.updateGroupSummary(groupId);
    }
    
    updateConditionsForGroup(groupId, source, messageType) {
        const conditionsContainer = document.getElementById(`conditions-${groupId}`);
        const fields = SourceSchemaHelpers.getAvailableFields(source, messageType);
        
        conditionsContainer.innerHTML = `
            <div style="margin-bottom: 15px;">
                <button type="button" class="btn btn-sm btn-secondary" onclick="app.addConditionToGroup('${groupId}', '${source}', '${messageType}')">
                    <i class="fas fa-plus"></i> Add Condition
                </button>
            </div>
            <div id="conditions-list-${groupId}">
                <!-- Conditions will be added here -->
            </div>
        `;
        
        // Add one condition by default
        this.addConditionToGroup(groupId, source, messageType);
    }
    
    addConditionToGroup(groupId, source, messageType) {
        const conditionsListContainer = document.getElementById(`conditions-list-${groupId}`);
        const conditionId = `condition-${groupId}-${Date.now()}`;
        const fields = SourceSchemaHelpers.getAvailableFields(source, messageType);
        
        const conditionElement = document.createElement('div');
        conditionElement.className = 'single-condition';
        conditionElement.dataset.conditionId = conditionId;
        
        conditionElement.innerHTML = `
            <select class="form-control" onchange="app.onFieldChange('${conditionId}', '${source}', '${messageType}')">
                <option value="">Select Field</option>
                ${fields.map(field => `<option value="${field.name}">${field.label}</option>`).join('')}
            </select>
            <select class="form-control" disabled>
                <option value="">Select Operator</option>
            </select>
            <input type="text" class="form-control" placeholder="Value" disabled>
            <span class="condition-type-display" style="font-size: 12px; color: #666;">-</span>
            <button type="button" class="btn btn-sm btn-danger" onclick="app.removeConditionFromGroup('${conditionId}', '${groupId}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        conditionsListContainer.appendChild(conditionElement);
        
        // Add condition logic separator if there are multiple conditions
        const existingConditions = conditionsListContainer.querySelectorAll('.single-condition');
        if (existingConditions.length > 1) {
            this.updateConditionLogicDisplay(groupId);
        }
        
        this.updateGroupSummary(groupId);
    }
    
    onFieldChange(conditionId, source, messageType) {
        const conditionElement = document.querySelector(`[data-condition-id="${conditionId}"]`);
        const fieldSelect = conditionElement.querySelector('select:first-child');
        const operatorSelect = conditionElement.querySelector('select:nth-child(2)');
        const valueInput = conditionElement.querySelector('input');
        const typeDisplay = conditionElement.querySelector('.condition-type-display');
        
        const fieldName = fieldSelect.value;
        if (!fieldName) {
            operatorSelect.disabled = true;
            valueInput.disabled = true;
            operatorSelect.innerHTML = '<option value="">Select Operator</option>';
            typeDisplay.textContent = '-';
            return;
        }
        
        const field = SourceSchemaHelpers.getField(source, fieldName, messageType);
        if (!field) return;
        
        // Populate operators
        operatorSelect.disabled = false;
        operatorSelect.innerHTML = `
            <option value="">Select Operator</option>
            ${field.operators.map(op => `<option value="${op}">${OperatorLabels[op]}</option>`).join('')}
        `;
        
        // Enable value input and show type
        valueInput.disabled = false;
        valueInput.placeholder = field.type === 'boolean' ? 'true/false' : `Enter ${field.type}`;
        typeDisplay.textContent = field.type;
        
        // Add change listener for operator and value to update summary
        operatorSelect.onchange = () => this.updateGroupSummary(conditionId.split('-')[1]);
        valueInput.onchange = () => this.updateGroupSummary(conditionId.split('-')[1]);
    }
    
    removeConditionFromGroup(conditionId, groupId) {
        const conditionElement = document.querySelector(`[data-condition-id="${conditionId}"]`);
        const conditionsListContainer = document.getElementById(`conditions-list-${groupId}`);
        const conditionCount = conditionsListContainer.querySelectorAll('.single-condition').length;
        
        if (conditionCount > 1) {
            conditionElement.remove();
            this.updateConditionLogicDisplay(groupId);
            this.updateGroupSummary(groupId);
        } else {
            this.showNotification('At least one condition is required per group', 'warning');
        }
    }
    
    updateConditionLogicDisplay(groupId) {
        const conditionsListContainer = document.getElementById(`conditions-list-${groupId}`);
        const conditions = conditionsListContainer.querySelectorAll('.single-condition');
        
        // Remove existing logic displays
        conditionsListContainer.querySelectorAll('.condition-logic-inline').forEach(el => el.remove());
        
        // Add logic displays between conditions
        conditions.forEach((condition, index) => {
            if (index < conditions.length - 1) {
                const logicDiv = document.createElement('div');
                logicDiv.className = 'condition-logic-inline';
                logicDiv.innerHTML = `
                    <label>
                        <input type="radio" name="condition-logic-${groupId}" value="AND" checked>
                        AND
                    </label>
                    <label style="margin-left: 15px;">
                        <input type="radio" name="condition-logic-${groupId}" value="OR">
                        OR
                    </label>
                `;
                condition.parentNode.insertBefore(logicDiv, condition.nextSibling);
            }
        });
    }
    
    updateGroupSummary(groupId) {
        const summaryDiv = document.getElementById(`group-summary-${groupId}`);
        const sourceInput = document.querySelector(`input[name="source-${groupId}"]:checked`);
        
        if (!sourceInput) {
            summaryDiv.style.display = 'none';
            return;
        }
        
        const source = sourceInput.value;
        const schema = SourceSchemas[source];
        const selectedMessageType = document.querySelector(`#message-type-options-${groupId} .message-type-option.selected`);
        const messageType = selectedMessageType ? selectedMessageType.textContent.toLowerCase().trim() : null;
        
        let summary = `<strong>Platform:</strong> ${schema.name}`;
        if (messageType) {
            summary += ` <strong>Type:</strong> ${messageType}`;
        }
        
        const conditionsListContainer = document.getElementById(`conditions-list-${groupId}`);
        const conditions = conditionsListContainer.querySelectorAll('.single-condition');
        const validConditions = Array.from(conditions).filter(condition => {
            const fieldSelect = condition.querySelector('select:first-child');
            const operatorSelect = condition.querySelector('select:nth-child(2)');
            const valueInput = condition.querySelector('input');
            return fieldSelect.value && operatorSelect.value && valueInput.value;
        });
        
        if (validConditions.length > 0) {
            summary += ` <strong>Conditions:</strong> ${validConditions.length} condition(s)`;
        }
        
        summaryDiv.innerHTML = summary;
        summaryDiv.style.display = 'block';
    }
    
    removeConditionGroup(groupId) {
        const groupCard = document.querySelector(`[data-group-id="${groupId}"]`);
        const container = document.getElementById('condition-groups-container');
        const groupCount = container.querySelectorAll('.condition-group-card').length;
        
        if (groupCount > 1) {
            groupCard.remove();
            this.updateGroupLogicVisibility();
            
            // Update dynamic field selector when groups are removed
            this.updateDynamicFieldSelector();
        } else {
            this.showNotification('At least one condition group is required', 'warning');
        }
    }
    
    updateGroupLogicVisibility() {
        const container = document.getElementById('condition-groups-container');
        const groupCount = container.querySelectorAll('.condition-group-card').length;
        const logicSelector = document.getElementById('group-logic-selector');
        
        logicSelector.style.display = groupCount > 1 ? 'block' : 'none';
    }
    
    extractConditionGroup(groupCard) {
        const groupId = groupCard.dataset.groupId;
        const sourceInput = groupCard.querySelector(`input[name="source-${groupId}"]:checked`);
        
        if (!sourceInput) return null;
        
        const source = sourceInput.value;
        const selectedMessageType = groupCard.querySelector(`#message-type-options-${groupId} .message-type-option.selected`);
        const messageType = selectedMessageType ? selectedMessageType.textContent.toLowerCase().trim() : null;
        
        const conditionsListContainer = document.getElementById(`conditions-list-${groupId}`);
        const conditionElements = conditionsListContainer.querySelectorAll('.single-condition');
        const conditions = [];
        
        conditionElements.forEach(conditionElement => {
            const fieldSelect = conditionElement.querySelector('select:first-child');
            const operatorSelect = conditionElement.querySelector('select:nth-child(2)');
            const valueInput = conditionElement.querySelector('input');
            const typeDisplay = conditionElement.querySelector('.condition-type-display');
            
            const field = fieldSelect.value;
            const operator = operatorSelect.value;
            const value = valueInput.value;
            const dataType = typeDisplay.textContent;
            
            if (field && operator && value) {
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
        
        const conditionLogicInput = groupCard.querySelector(`input[name="condition-logic-${groupId}"]:checked`);
        const conditionLogic = conditionLogicInput ? conditionLogicInput.value : 'AND';
        
        return {
            source,
            messageType,
            conditions,
            conditionLogic
        };
    }

    // Dynamic Field Selector Methods
    updateDynamicFieldSelector() {
        const selectedSources = this.getSelectedSources();
        const container = document.getElementById('dynamic-field-selector-content');
        
        if (selectedSources.length === 0) {
            container.innerHTML = `
                <div class="no-fields-message">
                    <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Select platforms in your condition groups to see available fields</p>
                </div>
            `;
            return;
        }
        
        const availableFields = SourceSchemaHelpers.getAvailableOutputFields(selectedSources);
        this.renderDynamicFieldSelector(availableFields, selectedSources);
    }
    
    getSelectedSources() {
        const sources = new Set();
        const conditionGroups = document.querySelectorAll('.condition-group-card');
        
        conditionGroups.forEach(group => {
            const groupId = group.dataset.groupId;
            const sourceInput = group.querySelector(`input[name="source-${groupId}"]:checked`);
            if (sourceInput) {
                sources.add(sourceInput.value);
            }
        });
        
        return Array.from(sources);
    }
    
    renderDynamicFieldSelector(fields, selectedSources) {
        const container = document.getElementById('dynamic-field-selector-content');
        
        // Group fields by category
        const fieldsByCategory = {
            common: fields.filter(f => f.category === 'common'),
            platform: fields.filter(f => f.category === 'platform'),
            'message-type': fields.filter(f => f.category === 'message-type')
        };
        
        let html = '';
        
        // Render common fields
        if (fieldsByCategory.common.length > 0) {
            html += this.renderFieldSection('Common Fields', fieldsByCategory.common, 'common');
        }
        
        // Render platform-specific fields
        if (fieldsByCategory.platform.length > 0) {
            const platformFields = {};
            fieldsByCategory.platform.forEach(field => {
                const platform = field.platforms[0];
                if (!platformFields[platform]) {
                    platformFields[platform] = [];
                }
                platformFields[platform].push(field);
            });
            
            Object.keys(platformFields).forEach(platform => {
                const schema = SourceSchemas[platform];
                const title = `${schema.name} Exclusive Fields`;
                html += this.renderFieldSection(title, platformFields[platform], `platform-${platform}`);
            });
        }
        
        // Render message type fields
        if (fieldsByCategory['message-type'].length > 0) {
            html += this.renderFieldSection('Message Type Specific Fields', fieldsByCategory['message-type'], 'message-type');
        }
        
        container.innerHTML = html;
        
        // Restore previously selected fields
        this.restoreFieldSelections();
    }
    
    renderFieldSection(title, fields, categoryClass) {
        if (fields.length === 0) return '';
        
        return `
            <div class="field-section">
                <div class="field-section-title">
                    <i class="fas fa-layer-group"></i> ${title}
                </div>
                <div class="field-grid">
                    ${fields.map(field => this.renderFieldOption(field, categoryClass)).join('')}
                </div>
            </div>
        `;
    }
    
    renderFieldOption(field, categoryClass) {
        const isAvailable = field.available !== false;
        const availabilityClass = isAvailable ? 'available' : 'unavailable';
        
        let badgeText = '';
        let helpText = '';
        
        if (field.category === 'common') {
            badgeText = 'COMMON';
            helpText = 'Available on all platforms';
        } else if (field.category === 'platform') {
            const schema = SourceSchemas[field.platforms[0]];
            badgeText = schema.name.toUpperCase();
            helpText = `Only available for ${schema.name} messages`;
        } else if (field.category === 'message-type') {
            badgeText = field.messageType?.toUpperCase() || 'TYPE';
            helpText = `Available for ${field.messageType || 'specific message'} types`;
        }
        
        return `
            <div class="field-option ${categoryClass} ${availabilityClass}">
                <input type="checkbox" id="field-${field.name}" value="${field.name}" ${!isAvailable ? 'disabled' : ''}>
                <label for="field-${field.name}" class="field-label">
                    ${field.label}
                    ${helpText ? `<div class="field-help-text">${helpText}</div>` : ''}
                </label>
                <span class="field-badge">${badgeText}</span>
            </div>
        `;
    }
    
    restoreFieldSelections() {
        // Get previously selected fields from the form data if editing
        const defaultSelections = ['name', 'comment']; // Default selections
        
        defaultSelections.forEach(fieldName => {
            const checkbox = document.getElementById(`field-${fieldName}`);
            if (checkbox && !checkbox.disabled) {
                checkbox.checked = true;
            }
        });
    }

    initializeCreateRuleTab() {
        const container = document.getElementById('condition-groups-container');
        
        // Clear any existing condition groups
        container.innerHTML = '';
        
        // Add initial condition group if none exist
        if (container.querySelectorAll('.condition-group-card').length === 0) {
            this.addConditionGroup();
        }
        
        // Initialize dynamic field selector
        this.updateDynamicFieldSelector();
    }

    clearForm() {
        document.getElementById('rule-form').reset();
        
        // Clear condition groups (enhanced rule builder)
        const conditionGroupsContainer = document.getElementById('condition-groups-container');
        if (conditionGroupsContainer) {
            conditionGroupsContainer.innerHTML = '';
            this.addConditionGroup(); // Add one empty group
        }
        
        // Legacy condition clearing (for backward compatibility)
        const legacyContainer = document.getElementById('conditions-container');
        if (legacyContainer) {
            const conditionGroups = legacyContainer.querySelectorAll('.condition-group');
            conditionGroups.forEach((group, index) => {
                if (index > 0) group.remove();
            });
            
            // Clear the first condition if it exists
            const firstGroup = legacyContainer.querySelector('.condition-group');
            if (firstGroup) {
                firstGroup.querySelector('.condition-field').value = '';
                firstGroup.querySelector('.condition-operator').value = 'equals';
                firstGroup.querySelector('.condition-value').value = '';
                firstGroup.querySelector('.condition-type').value = 'string';
            }
        }
        
        // Clear dynamic field selector content
        const dynamicFieldContent = document.getElementById('dynamic-field-selector-content');
        if (dynamicFieldContent) {
            dynamicFieldContent.innerHTML = `
                <div class="no-fields-message">
                    <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Select platforms in your condition groups to see available fields</p>
                </div>
            `;
        }
        
        // Reset legacy field checkboxes (for backward compatibility)
        document.querySelectorAll('#field-selector input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.id === 'field-name' || checkbox.id === 'field-comment') {
                checkbox.checked = true;
            } else {
                checkbox.checked = false;
            }
        });
        
        // Reset group logic to OR
        const groupLogicOR = document.querySelector('input[name="group-logic"][value="OR"]');
        if (groupLogicOR) groupLogicOR.checked = true;
        
        // Hide group logic selector
        this.updateGroupLogicVisibility();
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
        console.log('Edit rule called with ID:', ruleId);
        const rule = this.rules.find(r => r.id === ruleId);
        console.log('Found rule:', rule);
        
        if (!rule) {
            console.error('Rule not found!');
            this.showNotification('Rule not found', 'error');
            return;
        }
        
        try {
            this.openEditModal(rule);
        } catch (error) {
            console.error('Error opening edit modal:', error);
            this.showNotification('Error opening edit modal: ' + error.message, 'error');
        }
    }
    
    openEditModal(rule) {
        console.log('Opening edit modal for rule:', rule);
        
        // Store the rule being edited
        this.editingRule = rule;
        
        // Create the edit form
        const modalBody = document.getElementById('edit-modal-body');
        if (!modalBody) {
            console.error('Modal body element not found!');
            throw new Error('Modal body element not found');
        }
        
        console.log('Generating edit form...');
        try {
            modalBody.innerHTML = this.generateEditForm();
            console.log('Edit form generated successfully');
        } catch (error) {
            console.error('Error generating edit form:', error);
            throw error;
        }
        
        // Populate the form with rule data
        console.log('Populating edit form...');
        try {
            this.populateEditForm(rule);
            console.log('Edit form populated successfully');
        } catch (error) {
            console.error('Error populating edit form:', error);
            // Continue anyway, show the modal even if population fails
        }
        
        // Show the modal
        console.log('Showing edit modal...');
        const modal = document.getElementById('edit-modal');
        if (!modal) {
            console.error('Modal element not found!');
            throw new Error('Modal element not found');
        }
        
        modal.classList.add('show');
        console.log('Edit modal shown');
    }
    
    generateEditForm() {
        return `
            <form id="edit-rule-form">
                <div class="form-group">
                    <label for="edit-rule-name">Rule Name</label>
                    <input type="text" id="edit-rule-name" class="form-control" placeholder="e.g., High Value Gifts" required>
                </div>

                <div class="form-group">
                    <label for="edit-rule-description">Description</label>
                    <textarea id="edit-rule-description" class="form-control" rows="3" placeholder="Describe what this rule does"></textarea>
                </div>

                <div class="form-group">
                    <label>Rule Conditions</label>
                    <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 15px 0;">
                        <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                            <h4 style="margin: 0 0 10px 0; color: #1976d2;"><i class="fas fa-lightbulb"></i> Enhanced Rule Builder</h4>
                            <p style="margin: 0; color: #0d47a1;">Create complex rules like "YouTube with SuperChat > $20 OR Bilibili with gift > ¥50". Each condition group targets a specific platform with its own criteria.</p>
                        </div>
                        
                        <div id="edit-condition-groups-container">
                            <!-- Condition groups will be dynamically added here -->
                        </div>
                        
                        <div style="margin: 20px 0; text-align: center;">
                            <button type="button" class="btn btn-primary" onclick="app.addEditConditionGroup()">
                                <i class="fas fa-plus"></i> Add Condition Group
                            </button>
                        </div>
                        
                        <div id="edit-group-logic-selector" class="logic-selector" style="display: none; margin-top: 20px; padding: 15px; background: white; border-radius: 6px;">
                            <h5 style="margin-bottom: 10px;"><i class="fas fa-code-branch"></i> Logic Between Groups</h5>
                            <label style="margin-right: 20px;">
                                <input type="radio" name="edit-group-logic" value="OR" checked> 
                                <strong>OR</strong> - Any group can match (recommended)
                            </label>
                            <label>
                                <input type="radio" name="edit-group-logic" value="AND"> 
                                <strong>AND</strong> - All groups must match
                            </label>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="edit-action-endpoint">Custom OSC Endpoint</label>
                    <input type="text" id="edit-action-endpoint" class="form-control" placeholder="/onecomme/custom-endpoint" required>
                </div>

                <div class="form-group">
                    <label>Fields to Include in OSC Message</label>
                    <div class="dynamic-field-selector">
                        <div style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
                            <h4 style="margin: 0 0 10px 0; color: #1976d2;"><i class="fas fa-info-circle"></i> Dynamic Field Selection</h4>
                            <p style="margin: 0; color: #0d47a1; font-size: 13px;">Available fields are automatically filtered based on the platforms selected in your condition groups. Platform-exclusive fields are highlighted with color coding.</p>
                        </div>
                        
                        <div id="edit-field-legend" class="field-legend">
                            <div class="legend-item">
                                <div class="legend-color common"></div>
                                <span>Common (All Platforms)</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color youtube"></div>
                                <span>YouTube Only</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color bilibili"></div>
                                <span>Bilibili Only</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color niconico"></div>
                                <span>Niconico Only</span>
                            </div>
                            <div class="legend-item">
                                <div class="legend-color message-type"></div>
                                <span>Message Type Specific</span>
                            </div>
                        </div>
                        
                        <div id="edit-dynamic-field-selector-content">
                            <!-- Dynamic field content will be rendered here -->
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 10px;">
                        <input type="checkbox" id="edit-block-default">
                        <span>Block Default Routing (only send to custom endpoint)</span>
                    </label>
                </div>

                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" class="btn btn-secondary" onclick="app.closeEditModal()">Cancel</button>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-save"></i> Update Rule
                    </button>
                </div>
            </form>
        `;
    }
    
    populateEditForm(rule) {
        console.log('=== POPULATE EDIT FORM START ===');
        console.log('Rule to populate:', rule);
        console.log('Rule conditions:', rule.conditions);
        
        // Basic info
        document.getElementById('edit-rule-name').value = rule.name || '';
        document.getElementById('edit-rule-description').value = rule.description || '';
        
        // Populate conditions - use the same approach as create form
        const conditionsContainer = document.getElementById('edit-condition-groups-container');
        conditionsContainer.innerHTML = '';
        
        console.log('=== CONDITION POPULATION SECTION ===');
        console.log('rule.conditions exists:', !!rule.conditions);
        console.log('rule.conditions length:', rule.conditions ? rule.conditions.length : 'N/A');
        console.log('rule.conditions content:', rule.conditions);
        
        if (rule.conditions && rule.conditions.length > 0) {
            console.log('✅ CONDITIONS FOUND - Starting population process');
            console.log('Conditions to populate:', rule.conditions);
            
            // Add one condition group
            this.addEditConditionGroup();
            
            // Get the first condition group
            const groupCard = conditionsContainer.querySelector('.condition-group-card');
            if (groupCard) {
                const groupId = groupCard.dataset.groupId;
                console.log('Created condition group with ID:', groupId);
                
                // Try to determine the source/platform from the first condition's field
                let detectedSource = 'youtube'; // default
                if (rule.conditions[0]) {
                    const field = rule.conditions[0].field;
                    // Detect platform based on field names
                    if (['amount', 'currency', 'isMember', 'isModerator', 'isOwner'].includes(field)) {
                        detectedSource = 'youtube';
                    } else if (['coins', 'giftName', 'userLevel', 'guardLevel', 'isVip', 'isSvip', 'isGuard'].includes(field)) {
                        detectedSource = 'bilibili';
                    } else if (['isPremium', 'userId', 'userColor', 'userSize'].includes(field)) {
                        detectedSource = 'niconico';
                    }
                }
                
                console.log('Detected source:', detectedSource);
                
                // Set the detected source
                const sourceInput = groupCard.querySelector(`input[name="edit-source-${groupId}"][value="${detectedSource}"]`);
                if (sourceInput) {
                    sourceInput.checked = true;
                    console.log('Set source input to:', detectedSource);
                    
                    // Set a flag to indicate we're populating existing conditions
                    this.isPopulatingExistingConditions = true;
                    
                    // Trigger source change
                    this.onEditSourceChange(detectedSource, groupId);
                    
                    // Populate the conditions after source change completes
                    setTimeout(() => {
                        console.log('About to populate conditions for group:', groupId);
                        console.log('Conditions to populate:', rule.conditions);
                        
                        this.populateEditConditionsForGroup(groupId, rule.conditions);
                        
                        // Clear the flag after population
                        this.isPopulatingExistingConditions = false;
                    }, 400);
                } else {
                    console.warn('Source input not found for:', detectedSource);
                }
            } else {
                console.warn('Group card not found after creation');
            }
            
            // Set group logic
            const logicRadio = document.querySelector(`input[name="edit-group-logic"][value="${rule.conditionLogic || 'OR'}"]`);
            if (logicRadio) logicRadio.checked = true;
            
            this.updateEditGroupLogicVisibility();
        } else {
            console.log('❌ NO CONDITIONS FOUND - Adding empty condition group');
            console.log('Adding empty condition group because rule has no conditions');
            // Add empty condition group
            this.addEditConditionGroup();
        }
        
        // FALLBACK: Try direct condition population after a delay
        setTimeout(() => {
            console.log('=== FALLBACK CONDITION POPULATION ===');
            if (rule.conditions && rule.conditions.length > 0) {
                console.log('Attempting fallback condition population');
                this.directlyPopulateConditions(rule.conditions);
            }
        }, 1000);
        
        // Populate actions - use dynamic field selector
        document.getElementById('edit-action-endpoint').value = '';
        if (rule.actions && rule.actions.length > 0) {
            const action = rule.actions[0];
            document.getElementById('edit-action-endpoint').value = action.endpoint || '';
        }
        
        // Set block default
        document.getElementById('edit-block-default').checked = rule.blockDefault || false;
        
        // Update dynamic field selector
        this.updateEditDynamicFieldSelector();
        
        // Restore field selections after dynamic field selector is populated
        if (rule.actions && rule.actions.length > 0 && rule.actions[0].fields) {
            setTimeout(() => {
                this.restoreEditFieldSelections(rule.actions[0].fields);
            }, 300); // Increased timeout to ensure dynamic content is loaded
        }
        
        // Setup form submission
        document.getElementById('edit-rule-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateRule();
        });
    }
    
    populateEditConditionsForGroup(groupId, conditions) {
        console.log(`Populating conditions for group ${groupId}:`, conditions);
        
        if (!conditions || conditions.length === 0) {
            console.log('No conditions to populate');
            return;
        }
        
        // Function to attempt population
        const attemptPopulation = (attempt = 1) => {
            console.log(`Attempt ${attempt} to populate conditions for group ${groupId}`);
            
            const conditionsListContainer = document.getElementById(`edit-conditions-list-${groupId}`);
            if (!conditionsListContainer) {
                if (attempt < 5) {
                    console.warn(`Conditions list container not found for group: ${groupId}, retrying in ${attempt * 100}ms`);
                    setTimeout(() => attemptPopulation(attempt + 1), attempt * 100);
                    return;
                } else {
                    console.error(`Failed to find conditions list container after 5 attempts: ${groupId}`);
                    return;
                }
            }
            
            // Remove any existing conditions first
            conditionsListContainer.innerHTML = '';
            console.log('Cleared existing conditions');
            
            // Add each existing condition
            conditions.forEach((condition, index) => {
                console.log(`Adding condition ${index + 1}:`, condition);
                // Try to detect the source from the condition field
                let source = 'youtube'; // default
                const field = condition.field;
                if (['coins', 'giftName', 'userLevel', 'guardLevel', 'isVip', 'isSvip', 'isGuard'].includes(field)) {
                    source = 'bilibili';
                } else if (['isPremium', 'userId', 'userColor', 'userSize'].includes(field)) {
                    source = 'niconico';
                }
                
                try {
                    this.addEditConditionToGroup(groupId, source, null, condition);
                    console.log(`Successfully added condition ${index + 1}`);
                } catch (error) {
                    console.error(`Error adding condition ${index + 1}:`, error);
                }
            });
            
            console.log(`Completed adding ${conditions.length} conditions to group ${groupId}`);
            
            // Update the group summary after populating conditions
            try {
                this.updateEditGroupSummary(groupId);
            } catch (error) {
                console.error('Error updating group summary:', error);
            }
        };
        
        // Start the population process
        attemptPopulation();
    }
    
    // Edit Modal Condition Group Methods (matching create form)
    addEditConditionGroup() {
        const container = document.getElementById('edit-condition-groups-container');
        const groupId = 'edit-group-' + Date.now();
        
        const groupCard = document.createElement('div');
        groupCard.className = 'condition-group-card';
        groupCard.dataset.groupId = groupId;
        
        groupCard.innerHTML = this.generateEditConditionGroupHTML(groupId);
        container.appendChild(groupCard);
        
        // Show group logic selector if more than one group
        this.updateEditGroupLogicVisibility();
        
        // Initialize the first source as selected
        const firstSource = groupCard.querySelector('.source-option input[type="radio"]');
        if (firstSource) {
            firstSource.checked = true;
            this.onEditSourceChange(firstSource.value, groupId);
        }
    }
    
    generateEditConditionGroupHTML(groupId) {
        // Check if SourceSchemaHelpers is available
        let sources = [];
        try {
            sources = SourceSchemaHelpers.getAllSources();
        } catch (error) {
            console.warn('SourceSchemaHelpers not available, using fallback');
            sources = ['youtube', 'bilibili', 'niconico'];
        }
        
        return `
            <button type="button" class="group-remove-btn" onclick="app.removeEditConditionGroup('${groupId}')">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="condition-group-header">
                <h5 style="margin: 0;"><i class="fas fa-layer-group"></i> Condition Group</h5>
            </div>
            
            <div class="source-selector">
                <label style="font-weight: bold; margin-right: 10px;">Platform:</label>
                ${sources.map(source => {
                    let schema;
                    try {
                        schema = SourceSchemas[source];
                    } catch (error) {
                        // Fallback schema
                        schema = {
                            name: source.charAt(0).toUpperCase() + source.slice(1),
                            icon: 'fas fa-video',
                            color: '#667eea'
                        };
                    }
                    return `
                        <label class="source-option">
                            <input type="radio" name="edit-source-${groupId}" value="${source}" onchange="app.onEditSourceChange('${source}', '${groupId}')">
                            <i class="${schema.icon} source-icon" style="color: ${schema.color};"></i>
                            ${schema.name}
                        </label>
                    `;
                }).join('')}
            </div>
            
            <div id="edit-message-type-${groupId}" class="message-type-selector" style="display: none;">
                <label style="font-weight: bold;">Message Type:</label>
                <div class="message-type-options" id="edit-message-type-options-${groupId}">
                    <!-- Message type options will be populated here -->
                </div>
            </div>
            
            <div id="edit-conditions-${groupId}" class="conditions-list">
                <div class="empty-conditions">
                    <i class="fas fa-filter" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Select a platform to add conditions</p>
                </div>
            </div>
            
            <div id="edit-group-summary-${groupId}" class="group-summary" style="display: none;"></div>
        `;
    }
    
    onEditSourceChange(source, groupId) {
        let schema;
        try {
            schema = SourceSchemas[source];
            if (!schema) {
                console.warn(`Schema not found for source: ${source}`);
                return;
            }
        } catch (error) {
            console.warn(`Error getting schema for ${source}:`, error);
            return;
        }
        
        // Update message type selector
        const messageTypeContainer = document.getElementById(`edit-message-type-${groupId}`);
        const messageTypeOptions = document.getElementById(`edit-message-type-options-${groupId}`);
        
        if (!messageTypeContainer || !messageTypeOptions) {
            console.warn('Message type containers not found');
            return;
        }
        
        try {
            if (schema.messageTypes && schema.messageTypes.length > 1) {
                messageTypeContainer.style.display = 'block';
                messageTypeOptions.innerHTML = schema.messageTypes.map(type => `
                    <div class="message-type-option" onclick="app.onEditMessageTypeChange('${type}', '${groupId}')">
                        ${type.charAt(0).toUpperCase() + type.slice(1)}
                    </div>
                `).join('');
                
                // Select first message type by default
                const firstOption = messageTypeOptions.querySelector('.message-type-option');
                if (firstOption) {
                    firstOption.classList.add('selected');
                    this.onEditMessageTypeChange(schema.messageTypes[0], groupId);
                }
            } else {
                messageTypeContainer.style.display = 'none';
                this.updateEditConditionsForGroup(groupId, source, schema.messageTypes ? schema.messageTypes[0] : null);
            }
            
            this.updateEditGroupSummary(groupId);
            
            // Update dynamic field selector when sources change
            this.updateEditDynamicFieldSelector();
        } catch (error) {
            console.error('Error in onEditSourceChange:', error);
        }
    }
    
    onEditMessageTypeChange(messageType, groupId) {
        // Update visual selection
        const options = document.querySelectorAll(`#edit-message-type-options-${groupId} .message-type-option`);
        options.forEach(option => {
            option.classList.toggle('selected', option.textContent.toLowerCase().trim() === messageType);
        });
        
        // Get current source
        const sourceInput = document.querySelector(`input[name="edit-source-${groupId}"]:checked`);
        if (sourceInput) {
            this.updateEditConditionsForGroup(groupId, sourceInput.value, messageType);
        }
        
        this.updateEditGroupSummary(groupId);
    }
    
    updateEditConditionsForGroup(groupId, source, messageType) {
        const conditionsContainer = document.getElementById(`edit-conditions-${groupId}`);
        if (!conditionsContainer) {
            console.warn(`Conditions container not found for group: ${groupId}`);
            return;
        }
        
        let fields = [];
        try {
            fields = SourceSchemaHelpers.getAvailableFields(source, messageType);
        } catch (error) {
            console.warn('Error getting available fields, using fallback:', error);
            // Fallback fields
            fields = [
                { name: 'name', label: 'Name' },
                { name: 'comment', label: 'Comment' },
                { name: 'amount', label: 'Amount' },
                { name: 'platform', label: 'Platform' }
            ];
        }
        
        conditionsContainer.innerHTML = `
            <div style="margin-bottom: 15px;">
                <button type="button" class="btn btn-sm btn-secondary" onclick="app.addEditConditionToGroup('${groupId}', '${source}', '${messageType}')">
                    <i class="fas fa-plus"></i> Add Condition
                </button>
            </div>
            <div id="edit-conditions-list-${groupId}">
                <!-- Conditions will be added here -->
            </div>
        `;
        
        // Don't add a default condition if we're about to populate existing conditions
        // Check if we're in edit mode with existing conditions or if we're actively populating
        if ((this.editingRule && this.editingRule.conditions && this.editingRule.conditions.length > 0) || 
            this.isPopulatingExistingConditions) {
            console.log('Skipping default condition creation - will populate existing conditions or already populating');
        } else {
            // Add one condition by default only for new condition groups
            try {
                this.addEditConditionToGroup(groupId, source, messageType);
            } catch (error) {
                console.error('Error adding default condition:', error);
            }
        }
    }
    
    addEditConditionToGroup(groupId, source, messageType, existingCondition = null) {
        const conditionsListContainer = document.getElementById(`edit-conditions-list-${groupId}`);
        if (!conditionsListContainer) {
            console.warn(`Conditions list container not found for group: ${groupId}`);
            return;
        }
        
        const conditionId = `edit-condition-${groupId}-${Date.now()}`;
        
        let fields = [];
        try {
            fields = SourceSchemaHelpers.getAvailableFields(source, messageType);
        } catch (error) {
            console.warn('Error getting available fields for condition, using fallback:', error);
            fields = [
                { name: 'name', label: 'Name' },
                { name: 'comment', label: 'Comment' },
                { name: 'amount', label: 'Amount' },
                { name: 'platform', label: 'Platform' }
            ];
        }
        
        const conditionElement = document.createElement('div');
        conditionElement.className = 'single-condition';
        conditionElement.dataset.conditionId = conditionId;
        
        let operatorOptions = '<option value="">Select Operator</option>';
        let fieldValue = '';
        let dataType = '-';
        let isEnabled = '';
        
        if (existingCondition) {
            // Get available operators for the field
            try {
                operatorOptions += this.getOperatorOptionsForField(existingCondition.field, source, messageType, existingCondition.operator);
            } catch (error) {
                // Fallback operators
                const operators = ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'];
                operatorOptions += operators.map(op => 
                    `<option value="${op}" ${existingCondition.operator === op ? 'selected' : ''}>${op.replace('_', ' ')}</option>`
                ).join('');
            }
            fieldValue = existingCondition.value || '';
            dataType = existingCondition.type || existingCondition.dataType || 'string';
            isEnabled = ''; // enabled
        } else {
            isEnabled = 'disabled';
        }
        
        conditionElement.innerHTML = `
            <select class="form-control" onchange="app.onEditFieldChange('${conditionId}', '${source}', '${messageType}')">
                <option value="">Select Field</option>
                ${fields.map(field => `<option value="${field.name}" ${existingCondition && existingCondition.field === field.name ? 'selected' : ''}>${field.label}</option>`).join('')}
            </select>
            <select class="form-control" ${isEnabled}>
                ${operatorOptions}
            </select>
            <input type="text" class="form-control" placeholder="Value" value="${fieldValue}" ${isEnabled}>
            <span class="condition-type-display" style="font-size: 12px; color: #666;">${dataType}</span>
            <button type="button" class="btn btn-sm btn-danger" onclick="app.removeEditConditionFromGroup('${conditionId}', '${groupId}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        conditionsListContainer.appendChild(conditionElement);
        
        // If we have an existing condition, trigger field change to populate operators
        if (existingCondition) {
            setTimeout(() => {
                this.onEditFieldChange(conditionId, source, messageType);
            }, 50);
        }
        
        // Add condition logic separator if there are multiple conditions
        const existingConditions = conditionsListContainer.querySelectorAll('.single-condition');
        if (existingConditions.length > 1) {
            this.updateEditConditionLogicDisplay(groupId);
        }
        
        this.updateEditGroupSummary(groupId);
    }
    
    getOperatorOptionsForField(fieldName, source, messageType, selectedOperator = null) {
        let field;
        try {
            field = SourceSchemaHelpers.getField(source, fieldName, messageType);
        } catch (error) {
            console.warn('Error getting field schema, using fallback operators');
            // Fallback operators based on field name
            let operators = ['equals', 'not_equals'];
            if (['amount', 'coins', 'userLevel', 'guardLevel'].includes(fieldName)) {
                operators = ['equals', 'not_equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal'];
            } else if (['name', 'comment', 'giftName'].includes(fieldName)) {
                operators = ['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with'];
            }
            
            return operators.map(op => {
                const label = this.getOperatorLabel(op);
                return `<option value="${op}" ${selectedOperator === op ? 'selected' : ''}>${label}</option>`;
            }).join('');
        }
        
        if (!field) return '';
        
        try {
            return field.operators.map(op => {
                const label = OperatorLabels[op] || this.getOperatorLabel(op);
                return `<option value="${op}" ${selectedOperator === op ? 'selected' : ''}>${label}</option>`;
            }).join('');
        } catch (error) {
            console.warn('Error with OperatorLabels, using fallback');
            return field.operators.map(op => 
                `<option value="${op}" ${selectedOperator === op ? 'selected' : ''}>${op.replace('_', ' ')}</option>`
            ).join('');
        }
    }
    
    getOperatorLabel(operator) {
        const labels = {
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
        return labels[operator] || operator.replace('_', ' ');
    }
    
    // Debug method for testing condition population
    debugPopulateConditions() {
        if (!this.editingRule) {
            console.log('No rule being edited');
            return;
        }
        
        console.log('Current editing rule:', this.editingRule);
        console.log('Rule conditions:', this.editingRule.conditions);
        
        // Find the first condition group
        const groupCard = document.querySelector('#edit-condition-groups-container .condition-group-card');
        if (groupCard) {
            const groupId = groupCard.dataset.groupId;
            console.log('Found group card with ID:', groupId);
            
            // Try to populate conditions
            this.populateEditConditionsForGroup(groupId, this.editingRule.conditions);
        } else {
            console.log('No condition group card found');
        }
    }
    
    // Simple debug method to examine rules
    debugRules() {
        console.log('=== ALL RULES DEBUG ===');
        console.log('Total rules:', this.rules.length);
        this.rules.forEach((rule, index) => {
            console.log(`Rule ${index}:`, {
                id: rule.id,
                name: rule.name,
                conditions: rule.conditions,
                actions: rule.actions,
                enabled: rule.enabled
            });
        });
        
        if (this.editingRule) {
            console.log('Currently editing rule:', this.editingRule);
        } else {
            console.log('No rule currently being edited');
        }
    }
    
    // Direct method to populate conditions without complex timing logic
    directlyPopulateConditions(conditions) {
        console.log('=== DIRECT CONDITION POPULATION ===');
        console.log('Conditions to populate:', conditions);
        
        // Find the first condition group
        const groupCard = document.querySelector('#edit-condition-groups-container .condition-group-card');
        if (!groupCard) {
            console.error('No condition group card found');
            return;
        }
        
        const groupId = groupCard.dataset.groupId;
        console.log('Found group card with ID:', groupId);
        
        // Find the conditions list container
        const conditionsListContainer = document.getElementById(`edit-conditions-list-${groupId}`);
        if (!conditionsListContainer) {
            console.error('Conditions list container not found:', `edit-conditions-list-${groupId}`);
            return;
        }
        
        console.log('Found conditions list container');
        
        // Clear existing conditions
        conditionsListContainer.innerHTML = '';
        
        // Add each condition directly
        conditions.forEach((condition, index) => {
            console.log(`Creating condition ${index + 1}:`, condition);
            
            const conditionId = `direct-condition-${Date.now()}-${index}`;
            const conditionElement = document.createElement('div');
            conditionElement.className = 'single-condition';
            conditionElement.dataset.conditionId = conditionId;
            
            // Create simple HTML for the condition without complex logic
            conditionElement.innerHTML = `
                <select class="form-control">
                    <option value="">Select Field</option>
                    <option value="name" ${condition.field === 'name' ? 'selected' : ''}>Name</option>
                    <option value="comment" ${condition.field === 'comment' ? 'selected' : ''}>Comment</option>
                    <option value="amount" ${condition.field === 'amount' ? 'selected' : ''}>Amount</option>
                    <option value="currency" ${condition.field === 'currency' ? 'selected' : ''}>Currency</option>
                    <option value="platform" ${condition.field === 'platform' ? 'selected' : ''}>Platform</option>
                    <option value="coins" ${condition.field === 'coins' ? 'selected' : ''}>Coins</option>
                    <option value="giftName" ${condition.field === 'giftName' ? 'selected' : ''}>Gift Name</option>
                    <option value="userLevel" ${condition.field === 'userLevel' ? 'selected' : ''}>User Level</option>
                    <option value="isPremium" ${condition.field === 'isPremium' ? 'selected' : ''}>Is Premium</option>
                </select>
                <select class="form-control">
                    <option value="">Select Operator</option>
                    <option value="equals" ${condition.operator === 'equals' ? 'selected' : ''}>equals</option>
                    <option value="not_equals" ${condition.operator === 'not_equals' ? 'selected' : ''}>not equals</option>
                    <option value="greater_than" ${condition.operator === 'greater_than' ? 'selected' : ''}>greater than</option>
                    <option value="less_than" ${condition.operator === 'less_than' ? 'selected' : ''}>less than</option>
                    <option value="contains" ${condition.operator === 'contains' ? 'selected' : ''}>contains</option>
                </select>
                <input type="text" class="form-control" value="${condition.value || ''}" placeholder="Value">
                <span class="condition-type-display" style="font-size: 12px; color: #666;">${condition.dataType || condition.type || 'string'}</span>
                <button type="button" class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            conditionsListContainer.appendChild(conditionElement);
            console.log(`Added condition ${index + 1} successfully`);
        });
        
        console.log(`Direct population completed: ${conditions.length} conditions added`);
    }
    
    onEditFieldChange(conditionId, source, messageType) {
        const conditionElement = document.querySelector(`[data-condition-id="${conditionId}"]`);
        const fieldSelect = conditionElement.querySelector('select:first-child');
        const operatorSelect = conditionElement.querySelector('select:nth-child(2)');
        const valueInput = conditionElement.querySelector('input');
        const typeDisplay = conditionElement.querySelector('.condition-type-display');
        
        const fieldName = fieldSelect.value;
        if (!fieldName) {
            operatorSelect.disabled = true;
            valueInput.disabled = true;
            operatorSelect.innerHTML = '<option value="">Select Operator</option>';
            typeDisplay.textContent = '-';
            return;
        }
        
        const field = SourceSchemaHelpers.getField(source, fieldName, messageType);
        if (!field) return;
        
        // Populate operators
        operatorSelect.disabled = false;
        operatorSelect.innerHTML = `
            <option value="">Select Operator</option>
            ${field.operators.map(op => `<option value="${op}">${OperatorLabels[op]}</option>`).join('')}
        `;
        
        // Enable value input and show type
        valueInput.disabled = false;
        valueInput.placeholder = field.type === 'boolean' ? 'true/false' : `Enter ${field.type}`;
        typeDisplay.textContent = field.type;
        
        // Add change listener for operator and value to update summary
        operatorSelect.onchange = () => this.updateEditGroupSummary(conditionId.split('-')[2]);
        valueInput.onchange = () => this.updateEditGroupSummary(conditionId.split('-')[2]);
    }
    
    removeEditConditionFromGroup(conditionId, groupId) {
        const conditionElement = document.querySelector(`[data-condition-id="${conditionId}"]`);
        const conditionsListContainer = document.getElementById(`edit-conditions-list-${groupId}`);
        const conditionCount = conditionsListContainer.querySelectorAll('.single-condition').length;
        
        if (conditionCount > 1) {
            conditionElement.remove();
            this.updateEditConditionLogicDisplay(groupId);
            this.updateEditGroupSummary(groupId);
        } else {
            this.showNotification('At least one condition is required per group', 'warning');
        }
    }
    
    updateEditConditionLogicDisplay(groupId) {
        const conditionsListContainer = document.getElementById(`edit-conditions-list-${groupId}`);
        const conditions = conditionsListContainer.querySelectorAll('.single-condition');
        
        // Remove existing logic displays
        conditionsListContainer.querySelectorAll('.condition-logic-inline').forEach(el => el.remove());
        
        // Add logic displays between conditions
        conditions.forEach((condition, index) => {
            if (index < conditions.length - 1) {
                const logicDiv = document.createElement('div');
                logicDiv.className = 'condition-logic-inline';
                logicDiv.innerHTML = `
                    <label>
                        <input type="radio" name="edit-condition-logic-${groupId}" value="AND" checked>
                        AND
                    </label>
                    <label style="margin-left: 15px;">
                        <input type="radio" name="edit-condition-logic-${groupId}" value="OR">
                        OR
                    </label>
                `;
                condition.parentNode.insertBefore(logicDiv, condition.nextSibling);
            }
        });
    }
    
    updateEditGroupSummary(groupId) {
        const summaryDiv = document.getElementById(`edit-group-summary-${groupId}`);
        const sourceInput = document.querySelector(`input[name="edit-source-${groupId}"]:checked`);
        
        if (!sourceInput) {
            summaryDiv.style.display = 'none';
            return;
        }
        
        const source = sourceInput.value;
        const schema = SourceSchemas[source];
        const selectedMessageType = document.querySelector(`#edit-message-type-options-${groupId} .message-type-option.selected`);
        const messageType = selectedMessageType ? selectedMessageType.textContent.toLowerCase().trim() : null;
        
        let summary = `<strong>Platform:</strong> ${schema.name}`;
        if (messageType) {
            summary += ` <strong>Type:</strong> ${messageType}`;
        }
        
        const conditionsListContainer = document.getElementById(`edit-conditions-list-${groupId}`);
        const conditions = conditionsListContainer.querySelectorAll('.single-condition');
        const validConditions = Array.from(conditions).filter(condition => {
            const fieldSelect = condition.querySelector('select:first-child');
            const operatorSelect = condition.querySelector('select:nth-child(2)');
            const valueInput = condition.querySelector('input');
            return fieldSelect.value && operatorSelect.value && valueInput.value;
        });
        
        if (validConditions.length > 0) {
            summary += ` <strong>Conditions:</strong> ${validConditions.length} condition(s)`;
        }
        
        summaryDiv.innerHTML = summary;
        summaryDiv.style.display = 'block';
    }
    
    removeEditConditionGroup(groupId) {
        const groupCard = document.querySelector(`[data-group-id="${groupId}"]`);
        const container = document.getElementById('edit-condition-groups-container');
        const groupCount = container.querySelectorAll('.condition-group-card').length;
        
        if (groupCount > 1) {
            groupCard.remove();
            this.updateEditGroupLogicVisibility();
            
            // Update dynamic field selector when groups are removed
            this.updateEditDynamicFieldSelector();
        } else {
            this.showNotification('At least one condition group is required', 'warning');
        }
    }
    
    updateEditGroupLogicVisibility() {
        const container = document.getElementById('edit-condition-groups-container');
        const groupCount = container.querySelectorAll('.condition-group-card').length;
        const logicSelector = document.getElementById('edit-group-logic-selector');
        
        logicSelector.style.display = groupCount > 1 ? 'block' : 'none';
    }
    
    // Edit Dynamic Field Selector Methods
    updateEditDynamicFieldSelector() {
        const selectedSources = this.getEditSelectedSources();
        const container = document.getElementById('edit-dynamic-field-selector-content');
        
        if (!container) {
            console.warn('Dynamic field selector container not found');
            return;
        }
        
        if (selectedSources.length === 0) {
            container.innerHTML = `
                <div class="no-fields-message">
                    <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Select platforms in your condition groups to see available fields</p>
                </div>
            `;
            return;
        }
        
        try {
            const availableFields = SourceSchemaHelpers.getAvailableOutputFields(selectedSources);
            this.renderEditDynamicFieldSelector(availableFields, selectedSources);
        } catch (error) {
            console.warn('Error getting available fields, using fallback:', error);
            // Fallback to basic field selection with platform-specific fields
            container.innerHTML = `
                <div class="field-section">
                    <div class="field-section-title">
                        <i class="fas fa-layer-group"></i> Common Fields (All Platforms)
                    </div>
                    <div class="field-grid">
                        <div class="field-option common available">
                            <input type="checkbox" value="name" checked>
                            <div class="field-label">
                                Name (username)
                                <div class="field-help-text">User's display name</div>
                            </div>
                            <span class="field-badge">COMMON</span>
                        </div>
                        <div class="field-option common available">
                            <input type="checkbox" value="comment" checked>
                            <div class="field-label">
                                Comment (message text)
                                <div class="field-help-text">The actual message content</div>
                            </div>
                            <span class="field-badge">COMMON</span>
                        </div>
                        <div class="field-option common available">
                            <input type="checkbox" value="platform">
                            <div class="field-label">
                                Platform (source)
                                <div class="field-help-text">Message source platform</div>
                            </div>
                            <span class="field-badge">COMMON</span>
                        </div>
                        <div class="field-option common available">
                            <input type="checkbox" value="timestamp">
                            <div class="field-label">
                                Timestamp
                                <div class="field-help-text">When the message was sent</div>
                            </div>
                            <span class="field-badge">COMMON</span>
                        </div>
                        <div class="field-option common available">
                            <input type="checkbox" value="service">
                            <div class="field-label">
                                Service
                                <div class="field-help-text">Platform service identifier</div>
                            </div>
                            <span class="field-badge">COMMON</span>
                        </div>
                        <div class="field-option common available">
                            <input type="checkbox" value="type">
                            <div class="field-label">
                                Type
                                <div class="field-help-text">Message type (comment, superchat, etc.)</div>
                            </div>
                            <span class="field-badge">COMMON</span>
                        </div>
                    </div>
                </div>
                
                <div class="field-section">
                    <div class="field-section-title">
                        <i class="fas fa-layer-group"></i> YouTube Exclusive Fields
                    </div>
                    <div class="field-grid">
                        <div class="field-option platform-youtube available">
                            <input type="checkbox" value="amount">
                            <div class="field-label">
                                Amount
                                <div class="field-help-text">SuperChat donation amount</div>
                            </div>
                            <span class="field-badge">YOUTUBE</span>
                        </div>
                        <div class="field-option platform-youtube available">
                            <input type="checkbox" value="currency">
                            <div class="field-label">
                                Currency
                                <div class="field-help-text">Currency code (USD, JPY, etc.)</div>
                            </div>
                            <span class="field-badge">YOUTUBE</span>
                        </div>
                        <div class="field-option platform-youtube available">
                            <input type="checkbox" value="isMember">
                            <div class="field-label">
                                Is Member
                                <div class="field-help-text">Channel member status</div>
                            </div>
                            <span class="field-badge">YOUTUBE</span>
                        </div>
                        <div class="field-option platform-youtube available">
                            <input type="checkbox" value="isModerator">
                            <div class="field-label">
                                Is Moderator
                                <div class="field-help-text">Channel moderator status</div>
                            </div>
                            <span class="field-badge">YOUTUBE</span>
                        </div>
                        <div class="field-option platform-youtube available">
                            <input type="checkbox" value="isOwner">
                            <div class="field-label">
                                Is Owner
                                <div class="field-help-text">Channel owner status</div>
                            </div>
                            <span class="field-badge">YOUTUBE</span>
                        </div>
                    </div>
                </div>
                
                <div class="field-section">
                    <div class="field-section-title">
                        <i class="fas fa-layer-group"></i> Bilibili Exclusive Fields
                    </div>
                    <div class="field-grid">
                        <div class="field-option platform-bilibili available">
                            <input type="checkbox" value="coins">
                            <div class="field-label">
                                Coins
                                <div class="field-help-text">Gift value in coins</div>
                            </div>
                            <span class="field-badge">BILIBILI</span>
                        </div>
                        <div class="field-option platform-bilibili available">
                            <input type="checkbox" value="giftName">
                            <div class="field-label">
                                Gift Name
                                <div class="field-help-text">Name of the gift sent</div>
                            </div>
                            <span class="field-badge">BILIBILI</span>
                        </div>
                        <div class="field-option platform-bilibili available">
                            <input type="checkbox" value="userLevel">
                            <div class="field-label">
                                User Level
                                <div class="field-help-text">User's level on platform</div>
                            </div>
                            <span class="field-badge">BILIBILI</span>
                        </div>
                        <div class="field-option platform-bilibili available">
                            <input type="checkbox" value="guardLevel">
                            <div class="field-label">
                                Guard Level
                                <div class="field-help-text">User's guard/VIP level</div>
                            </div>
                            <span class="field-badge">BILIBILI</span>
                        </div>
                        <div class="field-option platform-bilibili available">
                            <input type="checkbox" value="isVip">
                            <div class="field-label">
                                Is VIP
                                <div class="field-help-text">VIP user status</div>
                            </div>
                            <span class="field-badge">BILIBILI</span>
                        </div>
                        <div class="field-option platform-bilibili available">
                            <input type="checkbox" value="isSvip">
                            <div class="field-label">
                                Is SVIP
                                <div class="field-help-text">Super VIP user status</div>
                            </div>
                            <span class="field-badge">BILIBILI</span>
                        </div>
                        <div class="field-option platform-bilibili available">
                            <input type="checkbox" value="isGuard">
                            <div class="field-label">
                                Is Guard
                                <div class="field-help-text">Guard user status</div>
                            </div>
                            <span class="field-badge">BILIBILI</span>
                        </div>
                    </div>
                </div>
                
                <div class="field-section">
                    <div class="field-section-title">
                        <i class="fas fa-layer-group"></i> Niconico Exclusive Fields
                    </div>
                    <div class="field-grid">
                        <div class="field-option platform-niconico available">
                            <input type="checkbox" value="isPremium">
                            <div class="field-label">
                                Is Premium
                                <div class="field-help-text">Premium user status</div>
                            </div>
                            <span class="field-badge">NICONICO</span>
                        </div>
                        <div class="field-option platform-niconico available">
                            <input type="checkbox" value="userId">
                            <div class="field-label">
                                User ID
                                <div class="field-help-text">Niconico user identifier</div>
                            </div>
                            <span class="field-badge">NICONICO</span>
                        </div>
                        <div class="field-option platform-niconico available">
                            <input type="checkbox" value="userColor">
                            <div class="field-label">
                                User Color
                                <div class="field-help-text">Comment color preference</div>
                            </div>
                            <span class="field-badge">NICONICO</span>
                        </div>
                        <div class="field-option platform-niconico available">
                            <input type="checkbox" value="userSize">
                            <div class="field-label">
                                User Size
                                <div class="field-help-text">Comment size preference</div>
                            </div>
                            <span class="field-badge">NICONICO</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    getEditSelectedSources() {
        const sources = new Set();
        const conditionGroups = document.querySelectorAll('#edit-condition-groups-container .condition-group-card');
        
        conditionGroups.forEach(group => {
            const groupId = group.dataset.groupId;
            const sourceInput = group.querySelector(`input[name="edit-source-${groupId}"]:checked`);
            if (sourceInput) {
                sources.add(sourceInput.value);
            }
        });
        
        return Array.from(sources);
    }
    
    renderEditDynamicFieldSelector(fields, selectedSources) {
        const container = document.getElementById('edit-dynamic-field-selector-content');
        
        // Group fields by category
        const fieldsByCategory = {
            common: fields.filter(f => f.category === 'common'),
            platform: fields.filter(f => f.category === 'platform'),
            'message-type': fields.filter(f => f.category === 'message-type')
        };
        
        let html = '';
        
        // Render common fields
        if (fieldsByCategory.common.length > 0) {
            html += this.renderEditFieldSection('Common Fields', fieldsByCategory.common, 'common');
        }
        
        // Render platform-specific fields
        if (fieldsByCategory.platform.length > 0) {
            const platformFields = {};
            fieldsByCategory.platform.forEach(field => {
                const platform = field.platforms[0];
                if (!platformFields[platform]) {
                    platformFields[platform] = [];
                }
                platformFields[platform].push(field);
            });
            
            Object.keys(platformFields).forEach(platform => {
                const schema = SourceSchemas[platform];
                const title = `${schema.name} Exclusive Fields`;
                html += this.renderEditFieldSection(title, platformFields[platform], `platform-${platform}`);
            });
        }
        
        // Render message type fields
        if (fieldsByCategory['message-type'].length > 0) {
            html += this.renderEditFieldSection('Message Type Specific Fields', fieldsByCategory['message-type'], 'message-type');
        }
        
        container.innerHTML = html;
        
        // Restore previously selected fields
        this.restoreEditFieldSelections();
    }
    
    renderEditFieldSection(title, fields, categoryClass) {
        if (fields.length === 0) return '';
        
        return `
            <div class="field-section">
                <div class="field-section-title">
                    <i class="fas fa-layer-group"></i> ${title}
                </div>
                <div class="field-grid">
                    ${fields.map(field => this.renderEditFieldOption(field, categoryClass)).join('')}
                </div>
            </div>
        `;
    }
    
    renderEditFieldOption(field, categoryClass) {
        const isAvailable = field.available !== false;
        const availabilityClass = isAvailable ? 'available' : 'unavailable';
        
        let badgeText = '';
        let helpText = '';
        
        if (field.category === 'common') {
            badgeText = 'COMMON';
            helpText = 'Available on all platforms';
        } else if (field.category === 'platform') {
            const schema = SourceSchemas[field.platforms[0]];
            badgeText = schema.name.toUpperCase();
            helpText = `Only available for ${schema.name} messages`;
        } else if (field.category === 'message-type') {
            badgeText = 'TYPE';
            helpText = `Available for ${field.messageTypes.join(', ')} messages`;
        }
        
        return `
            <div class="field-option ${categoryClass} ${availabilityClass}">
                <input type="checkbox" value="${field.name}" ${!isAvailable ? 'disabled' : ''}>
                <div class="field-label">
                    ${field.label}
                    <div class="field-help-text">${helpText}</div>
                </div>
                <span class="field-badge">${badgeText}</span>
            </div>
        `;
    }
    
    restoreEditFieldSelections(selectedFields = []) {
        console.log('Restoring field selections:', selectedFields);
        
        // If no specific fields provided, try to get them from the editing rule
        if (!selectedFields || selectedFields.length === 0) {
            if (this.editingRule && this.editingRule.actions && this.editingRule.actions[0] && this.editingRule.actions[0].fields) {
                selectedFields = this.editingRule.actions[0].fields;
            }
        }
        
        if (!selectedFields || selectedFields.length === 0) {
            console.log('No fields to restore');
            return;
        }
        
        // Clear all existing selections first
        document.querySelectorAll('#edit-dynamic-field-selector-content input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Restore the selected fields
        let restoredCount = 0;
        selectedFields.forEach(fieldName => {
            const checkbox = document.querySelector(`#edit-dynamic-field-selector-content input[value="${fieldName}"]`);
            if (checkbox) {
                checkbox.checked = true;
                restoredCount++;
                console.log(`Restored field: ${fieldName}`);
            } else {
                console.warn(`Field checkbox not found for: ${fieldName}`);
            }
        });
        
        console.log(`Restored ${restoredCount} out of ${selectedFields.length} field selections`);
        
        // Highlight the restored fields for better visual feedback
        selectedFields.forEach(fieldName => {
            const fieldOption = document.querySelector(`#edit-dynamic-field-selector-content input[value="${fieldName}"]`)?.closest('.field-option');
            if (fieldOption) {
                fieldOption.style.background = '#e3f2fd';
                fieldOption.style.border = '2px solid #2196f3';
                // Remove highlight after 2 seconds
                setTimeout(() => {
                    fieldOption.style.background = '';
                    fieldOption.style.border = '';
                }, 2000);
            }
        });
    }
    
    addEditCondition(groupIndex, condition = {}) {
        const container = document.getElementById(`edit-conditions-${groupIndex}`);
        const conditionIndex = container.children.length;
        
        const conditionDiv = document.createElement('div');
        conditionDiv.className = 'condition-row';
        conditionDiv.innerHTML = `
            <select class="edit-condition-field" required>
                <option value="">Select field...</option>
                <option value="name" ${condition.field === 'name' ? 'selected' : ''}>Name</option>
                <option value="comment" ${condition.field === 'comment' ? 'selected' : ''}>Comment</option>
                <option value="amount" ${condition.field === 'amount' ? 'selected' : ''}>Amount</option>
                <option value="currency" ${condition.field === 'currency' ? 'selected' : ''}>Currency</option>
                <option value="platform" ${condition.field === 'platform' ? 'selected' : ''}>Platform</option>
            </select>
            
            <select class="edit-condition-operator" required>
                <option value="equals" ${condition.operator === 'equals' ? 'selected' : ''}>equals</option>
                <option value="not_equals" ${condition.operator === 'not_equals' ? 'selected' : ''}>not equals</option>
                <option value="greater_than" ${condition.operator === 'greater_than' ? 'selected' : ''}>greater than</option>
                <option value="greater_than_or_equal" ${condition.operator === 'greater_than_or_equal' ? 'selected' : ''}>greater than or equal</option>
                <option value="less_than" ${condition.operator === 'less_than' ? 'selected' : ''}>less than</option>
                <option value="less_than_or_equal" ${condition.operator === 'less_than_or_equal' ? 'selected' : ''}>less than or equal</option>
                <option value="contains" ${condition.operator === 'contains' ? 'selected' : ''}>contains</option>
                <option value="not_contains" ${condition.operator === 'not_contains' ? 'selected' : ''}>not contains</option>
                <option value="starts_with" ${condition.operator === 'starts_with' ? 'selected' : ''}>starts with</option>
                <option value="ends_with" ${condition.operator === 'ends_with' ? 'selected' : ''}>ends with</option>
                <option value="regex" ${condition.operator === 'regex' ? 'selected' : ''}>matches regex</option>
            </select>
            
            <input type="text" class="edit-condition-value" placeholder="Value" value="${condition.value || ''}" required>
            
            <select class="edit-condition-type">
                <option value="string" ${condition.type === 'string' ? 'selected' : ''}>String</option>
                <option value="number" ${condition.type === 'number' ? 'selected' : ''}>Number</option>
            </select>
            
            <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()" style="padding: 4px 8px; font-size: 12px;">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        container.appendChild(conditionDiv);
    }
    
    updateEditGroupLogicVisibility() {
        const groupsContainer = document.getElementById('edit-condition-groups');
        const logicSelector = document.getElementById('edit-group-logic');
        
        if (groupsContainer && logicSelector) {
            const groupCount = groupsContainer.children.length;
            logicSelector.style.display = groupCount > 1 ? 'block' : 'none';
        }
    }
    
    async updateRule() {
        try {
            const formData = this.collectEditFormData();
            
            if (!formData) return; // Validation failed
            
            // Add the rule ID for updating
            formData.id = this.editingRule.id;
            
            const response = await fetch(`/api/rules/${this.editingRule.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Rule updated successfully!', 'success');
                this.closeEditModal();
                await this.refreshRules();
            } else {
                throw new Error(result.error || 'Failed to update rule');
            }
        } catch (error) {
            console.error('Failed to update rule:', error);
            this.showNotification('Failed to update rule: ' + error.message, 'error');
        }
    }
    
    collectEditFormData() {
        const name = document.getElementById('edit-rule-name').value.trim();
        const description = document.getElementById('edit-rule-description').value.trim();
        const endpoint = document.getElementById('edit-action-endpoint').value.trim();
        const blockDefault = document.getElementById('edit-block-default').checked;
        
        if (!name) {
            this.showNotification('Rule name is required', 'warning');
            return null;
        }
        
        if (!endpoint) {
            this.showNotification('OSC endpoint is required', 'warning');
            return null;
        }
        
        // Extract condition groups (using same logic as create form)
        const conditionGroups = [];
        const groupsContainer = document.getElementById('edit-condition-groups-container');
        const groupCards = groupsContainer.querySelectorAll('.condition-group-card');
        
        groupCards.forEach(groupCard => {
            const extractedGroup = this.extractEditConditionGroup(groupCard);
            if (extractedGroup) {
                conditionGroups.push(extractedGroup);
            }
        });
        
        if (conditionGroups.length === 0) {
            this.showNotification('At least one condition group with valid conditions is required', 'warning');
            return null;
        }
        
        // Flatten conditions from all groups
        const conditions = [];
        conditionGroups.forEach(group => {
            conditions.push(...group.conditions);
        });
        
        // Get group logic
        const conditionLogicRadio = document.querySelector('input[name="edit-group-logic"]:checked');
        const conditionLogic = conditionLogicRadio ? conditionLogicRadio.value : 'OR';
        
        // Collect selected fields from dynamic field selector
        const fields = [];
        document.querySelectorAll('#edit-dynamic-field-selector-content input[type="checkbox"]:checked').forEach(checkbox => {
            fields.push(checkbox.value);
        });
        
        if (fields.length === 0) {
            this.showNotification('At least one field must be selected for the OSC message', 'warning');
            return null;
        }
        
        // Build actions
        const actions = [{
            type: 'route_to_endpoint',
            endpoint: endpoint,
            fields: fields
        }];
        
        return {
            name,
            description,
            conditions,
            conditionLogic,
            actions,
            blockDefault,
            enabled: true
        };
    }
    
    extractEditConditionGroup(groupCard) {
        const groupId = groupCard.dataset.groupId;
        const sourceInput = groupCard.querySelector(`input[name="edit-source-${groupId}"]:checked`);
        
        if (!sourceInput) return null;
        
        const source = sourceInput.value;
        const selectedMessageType = groupCard.querySelector(`#edit-message-type-options-${groupId} .message-type-option.selected`);
        const messageType = selectedMessageType ? selectedMessageType.textContent.toLowerCase().trim() : null;
        
        const conditionsListContainer = document.getElementById(`edit-conditions-list-${groupId}`);
        const conditionElements = conditionsListContainer.querySelectorAll('.single-condition');
        const conditions = [];
        
        conditionElements.forEach(conditionElement => {
            const fieldSelect = conditionElement.querySelector('select:first-child');
            const operatorSelect = conditionElement.querySelector('select:nth-child(2)');
            const valueInput = conditionElement.querySelector('input');
            const typeDisplay = conditionElement.querySelector('.condition-type-display');
            
            const field = fieldSelect.value;
            const operator = operatorSelect.value;
            const value = valueInput.value;
            const dataType = typeDisplay.textContent;
            
            if (field && operator && value) {
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
        
        const conditionLogicInput = groupCard.querySelector(`input[name="edit-condition-logic-${groupId}"]:checked`);
        const conditionLogic = conditionLogicInput ? conditionLogicInput.value : 'AND';
        
        return {
            source,
            messageType,
            conditions,
            conditionLogic
        };
    }

    groupConditionsByPlatform(conditions) {
        // For simplicity, just return all conditions in one group for now
        // In a more advanced implementation, this could group by platform field
        return [conditions];
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
                document.getElementById('osc-message-format').value = data.config.oscMessageFormat || 'binary';
                document.getElementById('enable-default-endpoints').checked = data.config.enableDefaultEndpoints !== false;
                document.getElementById('remove-emojis').checked = data.config.removeEmojis === true;
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
            const oscMessageFormat = document.getElementById('osc-message-format').value || 'binary';
            
            if (oscPort < 1024 || oscPort > 65535) {
                this.showNotification('OSC Port must be between 1024 and 65535', 'warning');
                return;
            }
            
            const response = await fetch('/api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ oscHost, oscPort, oscMessageFormat })
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
    
    async saveEmojiSetting() {
        try {
            const removeEmojis = document.getElementById('remove-emojis').checked;
            
            const response = await fetch('/api/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    removeEmojis: removeEmojis
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const status = removeEmojis ? 'enabled' : 'disabled';
                this.showNotification(`Emoji removal ${status} successfully!`, 'success');
                
                // Show status message
                const statusDiv = document.getElementById('config-status');
                statusDiv.style.display = 'block';
                statusDiv.style.background = '#e6fffa';
                statusDiv.style.border = '1px solid #38b2ac';
                statusDiv.style.color = '#38b2ac';
                statusDiv.innerHTML = `
                    <i class="fas fa-check-circle"></i> 
                    <strong>Emoji Removal ${removeEmojis ? 'Enabled' : 'Disabled'}</strong><br>
                    ${removeEmojis 
                        ? 'All emojis will be removed from comment messages before processing.' 
                        : 'Emojis will be preserved in comment messages.'}
                `;
                
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 5000);
            } else {
                throw new Error(result.error || 'Failed to save emoji removal setting');
            }
            
        } catch (error) {
            console.error('Failed to save emoji removal setting:', error);
            this.showNotification('Failed to save emoji setting: ' + error.message, 'error');
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
        let content = '';
        
        // Gift Information (if present)
        if (data.hasGift) {
            hasContent = true;
            content += '<div class="log-readable-content">';
            content += '<div class="readable-fields">';
            content += '<div class="field-group gift-group">';
            content += '<div class="field-group-title"><i class="fas fa-gift"></i> Gift Information</div>';
            content += '<div class="gift-info-table">';
            content += '<div class="gift-info-row">';
            
            if (data.giftName) {
                content += `<span class="gift-name-primary">${this.escapeHtml(data.giftName)}</span>`;
            }
            
            if (data.price !== undefined) {
                const priceColor = data.price >= 50 ? '#e74c3c' : data.price >= 10 ? '#f39c12' : '#27ae60';
                const currency = service === 'bilibili' ? '¥' : '$';
                content += `<span class="gift-price-primary" style="color: ${priceColor}; font-weight: bold; margin-left: 10px;">${currency}${data.price}</span>`;
            }
            
            content += '</div>';
            content += '</div>';
            content += '</div>';
            content += '</div>';
            content += '</div>';
        }
        
        // Return empty string if no content to display
        return hasContent ? content : '';
    }
    
    formatTimestamp(timestamp) {
        if (!timestamp || typeof timestamp !== 'object') return 'N/A';
        
        const { year, month, day, hour, minute, second } = timestamp;
        if (!year || !month || !day) return 'Invalid timestamp';
        
        return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')} ${hour || 0}:${(minute || 0).toString().padStart(2, '0')}:${(second || 0).toString().padStart(2, '0')}`;
    }
    
    escapeHtml(text) {
        if (!text) return '';
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
                        <strong>${this.escapeHtml(userName)}</strong>${hasGift}
                    </div>
                    <div class="log-time">${time}</div>
                </div>
                <div class="log-content">
                    "${this.escapeHtml(userComment.substring(0, 150))}${userComment.length > 150 ? '...' : ''}"
                </div>
                ${readableContent || ''}
                <div class="log-toggle" onclick="toggleLogJson('${msg.id}')">
                    <i class="fas fa-code"></i> Click to view raw Data
                </div>
                <div class="log-json" id="json-${msg.id}">${this.escapeHtml(JSON.stringify(msg.data, null, 2))}</div>
            </div>
        `;
    }

    buildOutgoingReadableContent(data, endpoint) {
        let content = '<div class="log-readable-content">';
        content += '<div class="readable-fields">';
        
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
                        <span class="log-endpoint">${this.escapeHtml(msg.endpoint)}</span>
                        ${platformSpan}
                        ${msg.error ? `<span style="color: #f56565; font-size: 12px;">(${this.escapeHtml(msg.error)})</span>` : ''}
                    </div>
                    <div class="log-time">${time}</div>
                </div>
                ${readableContent || ''}
                <div class="log-toggle" onclick="toggleLogJson('${msg.id}')">
                    <i class="fas fa-code"></i> Click to view raw Data
                </div>
                <div class="log-json" id="json-${msg.id}">${this.escapeHtml(typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data, null, 2))}</div>
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

function saveEmojiSetting() {
    app.saveEmojiSetting();
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
