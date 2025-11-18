# User Guide Screenshot Status

## ✅ Captured Screenshots (9/18)

The following screenshots have been captured using Playwright and committed to the repository:

1. **rules_tab.png** - Active routing rules list view
2. **settings_tab_full.png** - Complete settings interface
3. **settings_default.png** - Default settings view
4. **logs_tab.png** - Logs interface showing system messages
5. **rule_builder_empty.png** - Empty rule creation form
6. **rule_builder_basic_info.png** - Rule form with basic information filled
7. **rule_builder_conditions.png** - Rule conditions section
8. **releases_page.png** - GitHub releases page
9. **web_interface_overview.png** - Main web interface landing page

## ⏳ Screenshots Requiring Manual Capture (9/18)

These screenshots require additional setup or external applications:

### Installation Steps
1. **plugin_folder_structure.png** - Screenshot of File Explorer showing OneComme plugins directory
   - Navigate to: `%APPDATA%\OneComme\plugins\onecomme-osc-router\`
   - Capture: Folder structure showing files

2. **console_plugin_loaded.png** - OneComme console showing plugin loaded
   - Requirements: Launch OneComme desktop application
   - Capture: Console/log output confirming "OneComme OSC Router plugin loaded"

3. **enable_plugin.png** - OneComme settings with plugin enabled
   - Requirements: OneComme desktop app
   - Navigate: Settings → Plugins
   - Capture: onecomme-osc-router plugin with toggle enabled

### Rule Building & Testing
4. **overview_tab_detailed.png** - Overview tab with actual statistics
   - Requirements: Active message routing (send test messages)
   - Navigate: Web UI → Overview tab
   - Capture: Statistics showing non-zero values

5. **rule_builder_mappings.png** - Field mappings section of rule builder
   - Status: May already be visible in rule_builder_conditions.png
   - Scroll: Ensure field selection checkboxes are visible

6. **rule_test_results.png** - Rule testing interface with results
   - Navigate: Web UI → Test Rules tab
   - Action: Select a rule and click "Test Rule"
   - Capture: Test results panel

7. **rule_saved_in_list.png** - Saved rule displayed in rules list
   - Status: Should be visible in current rules_tab.png
   - Verify: Shows rule details expanded

### VRChat Integration
8. **vrchat_osc_settings.png** - VRChat OSC settings page
   - Requirements: VRChat application installed
   - Navigate: VRChat → Settings → OSC
   - Capture: OSC enabled settings

9. **logs_vrchat_messages.png** - Logs showing VRChat OSC messages
   - Requirements: VRChat running + test messages sent
   - Navigate: Web UI → Logs tab
   - Capture: Logs with VRChat-specific OSC messages

## 📝 Notes

- All automated screenshots were captured at full page resolution
- Screenshots are stored in `docs/images/` directory
- File sizes range from 51KB (releases_page.png) to 635KB (rule_builder_conditions.png)
- Manual screenshots should match the style and resolution of automated captures
- Consider using Windows Snipping Tool or Greenshot for consistent captures

## 🔄 Next Steps

1. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Set source to "GitHub Actions"
   - Wait for deployment (~2 minutes)
   - Site will be available at: https://noodledostuff.github.io/onecommeOSCrouter/

2. **Capture Manual Screenshots**
   - Follow the list above
   - Save directly to `docs/images/` directory
   - Use descriptive filenames matching the placeholder names
   - Recommended resolution: 1920x1080 or similar

3. **Update HTML**
   - Replace placeholder SVGs with actual `<img>` tags in `docs/index.html`
   - Example: `<img src="images/rules_tab.png" alt="Rules Tab" class="screenshot">`

4. **Verify Deployment**
   - Check GitHub Actions tab for deployment status
   - Visit deployed site and verify all images load correctly
