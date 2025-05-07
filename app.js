// Email MultiApp Widget - Main JavaScript

// Global variables
let currentProvider = 'microsoft'; // Default provider
let refreshInterval = 10; // Default refresh interval in minutes
let authenticated = false; // Authentication status
let emails = []; // Array to store email data
let filteredEmails = []; // Array to store filtered emails
let selectedEmail = null; // Currently selected email
let refreshTimer = null; // Timer for refreshing emails
let composeAttachments = []; // Array to store compose attachments
let replyAttachments = []; // Array to store reply attachments
let isMobileView = false; // Flag for mobile view

// DOM Elements - Widget
const providerLogo = document.getElementById('provider-logo');
const providerName = document.getElementById('provider-name');
const emailListContainer = document.getElementById('email-list');
const emailDetailContainer = document.getElementById('email-detail');
const refreshBtn = document.getElementById('refresh-btn');
const settingsBtn = document.getElementById('settings-btn');
const composeBtn = document.getElementById('compose-btn');
const emailCountDisplay = document.getElementById('email-count');

// DOM Elements - Search
const emailSearch = document.getElementById('email-search');
const clearSearchBtn = document.getElementById('clear-search');

// DOM Elements - Settings Modal
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const providerSelect = document.getElementById('provider-select');
const refreshIntervalSelect = document.getElementById('refresh-interval');
const authBtn = document.getElementById('auth-btn');
const authStatus = document.getElementById('auth-status');
const saveSettingsBtn = document.getElementById('save-settings');

// DOM Elements - Compose Modal
const composeModal = document.getElementById('compose-modal');
const closeComposeBtn = document.getElementById('close-compose');
const composeTo = document.getElementById('compose-to');
const composeCc = document.getElementById('compose-cc');
const composeSubject = document.getElementById('compose-subject');
const composeBody = document.getElementById('compose-body');
const composeAttachmentsInput = document.getElementById('compose-attachments');
const attachmentList = document.getElementById('attachment-list');
const sendEmailBtn = document.getElementById('send-email');

// DOM Elements - Reply Modal
const replyModal = document.getElementById('reply-modal');
const replyHeader = document.getElementById('reply-header');
const closeReplyBtn = document.getElementById('close-reply');
const replyTo = document.getElementById('reply-to');
const replyCc = document.getElementById('reply-cc');
const replySubject = document.getElementById('reply-subject');
const replyBody = document.getElementById('reply-body');
const replyAttachmentsInput = document.getElementById('reply-attachments');
const replyAttachmentList = document.getElementById('reply-attachment-list');
const sendReplyBtn = document.getElementById('send-reply');

// Initialize the widget
function initWidget() {
    // Set initial provider
    updateProviderDisplay(currentProvider);
    
    // Check if mobile view
    checkMobileView();
    
    // Listen for window resize
    window.addEventListener('resize', checkMobileView);
    
    // Set event listeners (before loading emails, to ensure the UI is responsive)
    setupEventListeners();
    
    // Initialize the mobile tabs
    const inboxTab = document.getElementById('tab-inbox');
    if (inboxTab) {
        inboxTab.classList.add('active');
    }
    
    // Load mock emails
    loadEmails();
    
    // Start refresh timer
    startRefreshTimer();
    
    // Debug logs
    console.log('Widget initialized');
}

// Check if should use mobile view
function checkMobileView() {
    const wasMobileView = isMobileView;
    isMobileView = window.innerWidth <= 768;
    
    console.log(`Screen width: ${window.innerWidth}, Mobile view: ${isMobileView}`);
    
    // Update UI if view changed
    if (wasMobileView !== isMobileView) {
        const widgetContainer = document.querySelector('.widget-container');
        
        if (isMobileView) {
            // In mobile view, we want to show the list by default (remove mobile-view class)
            widgetContainer.classList.remove('mobile-view');
            
            // Also make sure the inbox tab is selected
            const tabs = document.querySelectorAll('.mobile-tab');
            tabs.forEach(tab => {
                tab.classList.remove('active');
            });
            document.getElementById('tab-inbox').classList.add('active');
            
            // Reload emails for mobile view
            loadEmails();
        } else {
            widgetContainer.classList.remove('mobile-view');
            
            // Reload emails for desktop view
            loadEmails();
        }
        
        // Reset view if switching from mobile to desktop
        if (!isMobileView && selectedEmail) {
            renderEmailDetail(selectedEmail);
        }
    }
}

// Update provider display
function updateProviderDisplay(provider) {
    const widgetContainer = document.querySelector('.widget-container');
    
    // Remove previous provider classes
    widgetContainer.classList.remove('provider-microsoft', 'provider-google', 'provider-yahoo');
    
    // Add current provider class
    widgetContainer.classList.add(`provider-${provider}`);
    
    // Update provider name
    switch(provider) {
        case 'microsoft':
            providerName.textContent = 'Microsoft Outlook';
            break;
        case 'google':
            providerName.textContent = 'Gmail';
            break;
        case 'yahoo':
            providerName.textContent = 'Yahoo Mail';
            break;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Widget buttons
    refreshBtn.addEventListener('click', refreshEmails);
    settingsBtn.addEventListener('click', openSettingsModal);
    composeBtn.addEventListener('click', openComposeModal);
    
    // Search functionality
    emailSearch.addEventListener('input', handleSearchInput);
    clearSearchBtn.addEventListener('click', clearSearch);
    
    // Mobile tabs
    document.getElementById('tab-inbox').addEventListener('click', () => switchMobileTab('inbox'));
    document.getElementById('tab-sent').addEventListener('click', () => switchMobileTab('sent'));
    document.getElementById('tab-drafts').addEventListener('click', () => switchMobileTab('drafts'));
    
    // Settings modal
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
    authBtn.addEventListener('click', authenticateProvider);
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    // Compose modal
    closeComposeBtn.addEventListener('click', closeComposeModal);
    composeAttachmentsInput.addEventListener('change', handleComposeAttachments);
    sendEmailBtn.addEventListener('click', sendEmail);
    
    // Reply modal
    closeReplyBtn.addEventListener('click', closeReplyModal);
    replyAttachmentsInput.addEventListener('change', handleReplyAttachments);
    sendReplyBtn.addEventListener('click', sendReply);
}

// Handle search input
function handleSearchInput() {
    const searchTerm = emailSearch.value.trim().toLowerCase();
    
    // Show/hide clear button
    if (searchTerm.length > 0) {
        clearSearchBtn.classList.add('visible');
    } else {
        clearSearchBtn.classList.remove('visible');
    }
    
    // Filter emails
    filterEmails(searchTerm);
}

// Clear search
function clearSearch() {
    emailSearch.value = '';
    clearSearchBtn.classList.remove('visible');
    filterEmails('');
}

// Filter emails based on search term
function filterEmails(searchTerm) {
    if (!searchTerm) {
        // If no search term, show all emails
        filteredEmails = [...emails];
    } else {
        // Filter emails based on search term
        filteredEmails = emails.filter(email => {
            return (
                email.sender.toLowerCase().includes(searchTerm) ||
                email.senderEmail.toLowerCase().includes(searchTerm) ||
                email.subject.toLowerCase().includes(searchTerm) ||
                email.body.toLowerCase().includes(searchTerm)
            );
        });
    }
    
    // Render the filtered emails
    renderEmailList();
    
    // Update count display
    updateEmailCount();
}

// Load mock emails
function loadEmails() {
    // Show loading indicator
    emailListContainer.innerHTML = `
        <div class="search-container">
            <div class="search-input-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input type="text" id="email-search" placeholder="Search emails...">
                <button id="clear-search" class="clear-search-btn"><i class="fas fa-times"></i></button>
            </div>
        </div>
        <div class="loading-indicator">Loading emails...</div>
    `;
    
    // Re-bind search elements as they were just recreated
    const emailSearch = document.getElementById('email-search');
    const clearSearchBtn = document.getElementById('clear-search');
    emailSearch.addEventListener('input', handleSearchInput);
    clearSearchBtn.addEventListener('click', clearSearch);
    
    // Simulate API delay
    setTimeout(() => {
        // Get mock emails based on provider
        emails = getMockEmails(currentProvider, 30); // Generate a good amount of emails
        
        // Set filtered emails initially to all emails
        filteredEmails = [...emails];
        
        // Debug log
        console.log(`Loaded ${emails.length} emails`);
        
        // Render emails
        renderEmailList();
        
        // Update email count
        updateEmailCount();
    }, 1000);
}

// Generate mock emails
function getMockEmails(provider, count) {
    const mockEmails = [];
    const domains = {
        microsoft: 'outlook.com',
        google: 'gmail.com',
        yahoo: 'yahoo.com'
    };
    
    const senders = [
        'John Smith', 'Jane Doe', 'Michael Johnson', 'Emily Wilson',
        'Robert Brown', 'Sarah Davis', 'David Martinez', 'Jessica Thompson',
        'Thomas Anderson', 'Lisa Garcia', 'James Miller', 'Patricia Rodriguez',
        'Charles Wilson', 'Jennifer Lee', 'Daniel Taylor', 'Margaret White'
    ];
    
    const subjects = [
        'Meeting scheduled for tomorrow',
        'Project update - Important!',
        'Quarterly report draft',
        'Invitation: Team lunch Friday',
        'New client proposal',
        'Budget approval request',
        'Conference registration confirmation',
        'System maintenance notification',
        'Holiday schedule update',
        'Contract review needed',
        'Product launch timeline',
        'Training session reminder',
        'Office supplies inventory',
        'Customer feedback summary',
        'New marketing strategy',
        'Website redesign update'
    ];
    
    const bodyTexts = [
        'Hi there,\n\nI wanted to touch base about the upcoming project deadline. Can we schedule a quick call tomorrow to discuss the remaining tasks?\n\nBest regards,',
        'Hello team,\n\nPlease find attached the latest version of the quarterly report. I need everyone\'s feedback by Friday.\n\nThanks,',
        'Dear colleague,\n\nThis is a reminder that we have a department meeting tomorrow at 10:00 AM in the main conference room. Please prepare a brief update on your current projects.\n\nRegards,',
        'Hi,\n\nJust following up on our conversation from last week. Have you had a chance to review the proposal? The client is eager to get started.\n\nBest,',
        'Hello,\n\nI\'m pleased to inform you that your request has been approved. We can proceed with the implementation as discussed.\n\nKind regards,',
        'Good morning,\n\nPlease review the attached document and provide your signature where indicated. Let me know if you have any questions.\n\nThank you,',
        'Hi team,\n\nI\'m sharing the updated project timeline. Please note that several deadlines have been adjusted based on client feedback.\n\nCheers,'
    ];
    
    const possibleAttachments = [
        { name: 'Quarterly_Report.pdf', size: '2.3 MB', type: 'pdf' },
        { name: 'Meeting_Notes.docx', size: '342 KB', type: 'docx' },
        { name: 'Budget_Forecast.xlsx', size: '1.1 MB', type: 'xlsx' },
        { name: 'Project_Timeline.pptx', size: '4.5 MB', type: 'pptx' },
        { name: 'Team_Photo.jpg', size: '1.8 MB', type: 'jpg' },
        { name: 'Client_Contract.pdf', size: '3.2 MB', type: 'pdf' },
        { name: 'Product_Specs.docx', size: '520 KB', type: 'docx' }
    ];
    
    const now = new Date();
    
    // Guarantee at least 3 emails with attachments (or all emails if count < 3)
    const guaranteedAttachmentCount = Math.min(3, count);
    const guaranteedIndices = [];
    
    while (guaranteedIndices.length < guaranteedAttachmentCount) {
        const randomIndex = Math.floor(Math.random() * count);
        if (!guaranteedIndices.includes(randomIndex)) {
            guaranteedIndices.push(randomIndex);
        }
    }
    
    for (let i = 0; i < count; i++) {
        const sender = senders[Math.floor(Math.random() * senders.length)];
        const senderEmail = sender.toLowerCase().replace(' ', '.') + '@' + domains[provider];
        const subject = subjects[Math.floor(Math.random() * subjects.length)];
        const bodyText = bodyTexts[Math.floor(Math.random() * bodyTexts.length)] + ' ' + sender;
        
        // Generate random date within last 7 days
        const emailDate = new Date(now);
        emailDate.setDate(now.getDate() - Math.floor(Math.random() * 7));
        emailDate.setHours(Math.floor(Math.random() * 24));
        emailDate.setMinutes(Math.floor(Math.random() * 60));
        
        // Decide if email has attachments - guaranteed for specific indices, random for others
        const hasAttachments = guaranteedIndices.includes(i) || Math.random() > 0.7;
        let attachments = [];
        
        if (hasAttachments) {
            // For guaranteed attachment emails, add multiple attachments (2-3)
            const attachmentCount = guaranteedIndices.includes(i) ? 
                Math.floor(Math.random() * 2) + 2 : // 2-3 attachments for guaranteed emails
                Math.floor(Math.random() * 3) + 1;  // 1-3 attachments for other emails
            
            // Set of used indices to avoid duplicates
            const usedIndices = new Set();
            
            for (let j = 0; j < attachmentCount; j++) {
                let randomIndex;
                // Ensure no duplicate attachments in the same email
                do {
                    randomIndex = Math.floor(Math.random() * possibleAttachments.length);
                } while (usedIndices.has(randomIndex));
                
                usedIndices.add(randomIndex);
                attachments.push(possibleAttachments[randomIndex]);
            }
        }
        
        // Create email object
        mockEmails.push({
            id: 'email_' + i,
            sender: sender,
            senderEmail: senderEmail,
            subject: subject,
            body: hasAttachments ? 
                bodyText + "\n\nPlease find the requested documents attached to this email." : 
                bodyText,
            date: emailDate,
            read: Math.random() > 0.3, // 30% chance of being unread
            attachments: attachments
        });
    }
    
    // Sort by date (newest first)
    mockEmails.sort((a, b) => b.date - a.date);
    
    // Make sure at least one of the first 3 emails has attachments for easy testing
    if (!mockEmails[0].attachments.length && !mockEmails[1].attachments.length && !mockEmails[2].attachments.length) {
        const randomAttachment = Math.floor(Math.random() * possibleAttachments.length);
        mockEmails[0].attachments = [possibleAttachments[randomAttachment]];
        mockEmails[0].body += "\n\nPlease find the requested document attached to this email.";
    }
    
    return mockEmails;
}

// Render email list
function renderEmailList() {
    // Preserve search field
    const searchContainer = emailListContainer.querySelector('.search-container');
    
    // Clear email list
    emailListContainer.innerHTML = '';
    
    // Add search container back
    if (searchContainer) {
        emailListContainer.appendChild(searchContainer);
    } else {
        // Create search container if it doesn't exist
        const newSearchContainer = document.createElement('div');
        newSearchContainer.className = 'search-container';
        newSearchContainer.innerHTML = `
            <div class="search-input-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input type="text" id="email-search" placeholder="Search emails...">
                <button id="clear-search" class="clear-search-btn"><i class="fas fa-times"></i></button>
            </div>
        `;
        emailListContainer.appendChild(newSearchContainer);
        
        // Re-bind search elements
        const emailSearch = document.getElementById('email-search');
        const clearSearchBtn = document.getElementById('clear-search');
        emailSearch.addEventListener('input', handleSearchInput);
        clearSearchBtn.addEventListener('click', clearSearch);
    }
    
    // Debug: Log the number of emails
    console.log(`Rendering email list with ${filteredEmails.length} emails`);
    
    // Show no results message if no emails after filtering
    if (!filteredEmails || filteredEmails.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.innerHTML = `
            <div class="no-emails-message">
                <i class="fas fa-search"></i>
                <p>No emails found</p>
            </div>
        `;
        emailListContainer.appendChild(noResults);
        return;
    }
    
    // Add each email to the list
    filteredEmails.forEach(email => {
        const emailItem = document.createElement('div');
        emailItem.classList.add('email-item');
        emailItem.dataset.emailId = email.id;
        
        // Add unread class if email is unread
        if (!email.read) {
            emailItem.classList.add('unread');
        }
        
        // Add selected class if this is the selected email
        if (selectedEmail && email.id === selectedEmail.id) {
            emailItem.classList.add('selected');
        }
        
        // Format date
        const formattedDate = formatEmailDate(email.date);
        
        // Check if email has attachments
        const hasAttachment = email.attachments && email.attachments.length > 0;
        
        // Create email item HTML
        emailItem.innerHTML = `
            <div class="email-item-header">
                <div class="email-item-sender">${email.sender}</div>
                <div class="email-item-time">${formattedDate}</div>
            </div>
            <div class="email-item-subject">
                ${hasAttachment ? '<i class="fas fa-paperclip attachment-icon"></i>' : ''}
                ${email.subject}
            </div>
            <div class="email-item-preview">${email.body.substring(0, 60)}...</div>
        `;
        
        // Add click event listener
        emailItem.addEventListener('click', () => {
            selectEmail(email);
        });
        
        // Add to container
        emailListContainer.appendChild(emailItem);
    });
}

// Format email date
function formatEmailDate(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date >= today) {
        return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    // Check if date is yesterday
    if (date >= yesterday) {
        return 'Yesterday';
    }
    
    // If date is within the last 7 days, show the day name
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 6);
    
    if (date >= oneWeekAgo) {
        return date.toLocaleDateString([], {weekday: 'short'});
    }
    
    // Otherwise, show the date
    return date.toLocaleDateString([], {month: 'short', day: 'numeric'});
}

// Select an email
function selectEmail(email) {
    // Update selected email
    selectedEmail = email;
    
    // Update read status
    if (!email.read) {
        email.read = true;
        renderEmailList(); // Re-render to update UI
    } else {
        // Update selected class
        const emailItems = document.querySelectorAll('.email-item');
        emailItems.forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.emailId === email.id) {
                item.classList.add('selected');
            }
        });
    }
    
    // Render email detail
    renderEmailDetail(email);
    
    // For mobile view, switch to detail view
    if (isMobileView) {
        document.querySelector('.widget-container').classList.add('mobile-view');
    }
}

// Render email detail
function renderEmailDetail(email) {
    // Create the HTML for the email detail
    const formattedDate = email.date.toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Create attachment HTML if needed
    let attachmentsHtml = '';
    if (email.attachments && email.attachments.length > 0) {
        attachmentsHtml = `
            <div class="email-detail-attachments">
                <div class="attachment-title">Attachments (${email.attachments.length})</div>
                ${email.attachments.map(attachment => `
                    <div class="attachment-item">
                        <i class="fas ${getAttachmentIcon(attachment.type)}"></i>
                        <a href="#" onclick="downloadAttachment('${attachment.name}'); return false;">
                            ${attachment.name} (${attachment.size})
                        </a>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // For mobile view, add back button
    const backButtonHtml = isMobileView ? `
        <div class="back-button" id="back-to-list">
            <i class="fas fa-arrow-left"></i> Back
        </div>
    ` : '';
    
    // Create the email detail HTML
    emailDetailContainer.innerHTML = `
        ${backButtonHtml}
        <div class="email-detail-content">
            <div class="email-detail-actions">
                <button class="action-btn" onclick="replyEmail(false);">
                    <i class="fas fa-reply"></i> Reply
                </button>
                <button class="action-btn" onclick="replyEmail(true);">
                    <i class="fas fa-reply-all"></i> Reply All
                </button>
                <button class="action-btn" onclick="forwardEmail();">
                    <i class="fas fa-share"></i> Forward
                </button>
            </div>
            <div class="email-detail-header">
                <div class="email-detail-subject">${email.subject}</div>
                <div class="email-detail-info">
                    <div class="email-detail-sender">${email.sender} &lt;${email.senderEmail}&gt;</div>
                    <div class="email-detail-date">${formattedDate}</div>
                </div>
                <div class="email-detail-recipients">
                    To: me@example.com
                </div>
            </div>
            <div class="email-detail-body">
                ${email.body.replace(/\n/g, '<br>')}
            </div>
            ${attachmentsHtml}
        </div>
    `;
    
    // Add event listener for back button in mobile view
    if (isMobileView) {
        document.getElementById('back-to-list').addEventListener('click', backToList);
    }
}

// Go back to email list in mobile view
function backToList() {
    console.log("Going back to email list");
    document.querySelector('.widget-container').classList.remove('mobile-view');
    // Optionally unselect the email
    selectedEmail = null;
}

// Get icon for attachment based on file type
function getAttachmentIcon(type) {
    switch(type) {
        case 'pdf':
            return 'fa-file-pdf';
        case 'docx':
        case 'doc':
            return 'fa-file-word';
        case 'xlsx':
        case 'xls':
            return 'fa-file-excel';
        case 'pptx':
        case 'ppt':
            return 'fa-file-powerpoint';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return 'fa-file-image';
        default:
            return 'fa-file';
    }
}

// Download attachment (mock function)
function downloadAttachment(fileName) {
    alert(`Downloading ${fileName}...`);
}

// Update email count display
function updateEmailCount() {
    const unreadCount = filteredEmails.filter(email => !email.read).length;
    
    if (filteredEmails.length < emails.length) {
        // If filtered, show filtered count
        if (unreadCount > 0) {
            emailCountDisplay.textContent = `${unreadCount} unread of ${filteredEmails.length} filtered (${emails.length} total)`;
        } else {
            emailCountDisplay.textContent = `${filteredEmails.length} filtered of ${emails.length} total`;
        }
    } else {
        // All emails shown
        if (unreadCount > 0) {
            emailCountDisplay.textContent = `${unreadCount} unread of ${emails.length} emails`;
        } else {
            emailCountDisplay.textContent = `${emails.length} emails`;
        }
    }
}

// Refresh emails
function refreshEmails() {
    // Add spinning animation to refresh button
    refreshBtn.querySelector('i').classList.add('refresh-spin');
    
    // Save search term
    const searchTerm = emailSearch ? emailSearch.value.trim().toLowerCase() : '';
    
    // Reload emails
    loadEmails();
    
    // Reapply search filter after loading
    setTimeout(() => {
        if (searchTerm) {
            emailSearch.value = searchTerm;
            filterEmails(searchTerm);
        }
    }, 1100);
    
    // Remove spinning animation after 1 second
    setTimeout(() => {
        refreshBtn.querySelector('i').classList.remove('refresh-spin');
    }, 1000);
}

// Start refresh timer
function startRefreshTimer() {
    // Clear existing timer if any
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }
    
    // Set new timer
    refreshTimer = setInterval(refreshEmails, refreshInterval * 60 * 1000);
}

// Settings Modal Functions
function openSettingsModal() {
    // Set current values
    providerSelect.value = currentProvider;
    refreshIntervalSelect.value = refreshInterval;
    
    // Update auth status
    if (authenticated) {
        authStatus.textContent = 'Authenticated';
        authStatus.style.color = '#52c41a';
    } else {
        authStatus.textContent = 'Not authenticated';
        authStatus.style.color = '#ff4d4f';
    }
    
    // Show modal
    settingsModal.style.display = 'flex';
}

function closeSettingsModal() {
    settingsModal.style.display = 'none';
}

function authenticateProvider() {
    // Mock authentication
    const provider = providerSelect.value;
    
    alert(`Authenticating with ${provider}...`);
    
    // Update auth status after "authentication"
    setTimeout(() => {
        authenticated = true;
        authStatus.textContent = 'Authenticated';
        authStatus.style.color = '#52c41a';
    }, 1000);
}

function saveSettings() {
    // Get new values
    const newProvider = providerSelect.value;
    const newRefreshInterval = parseInt(refreshIntervalSelect.value);
    
    // Check if provider changed
    const providerChanged = newProvider !== currentProvider;
    
    // Update settings
    currentProvider = newProvider;
    refreshInterval = newRefreshInterval;
    
    // Update provider display if changed
    if (providerChanged) {
        updateProviderDisplay(currentProvider);
    }
    
    // Reload emails if provider changed
    if (providerChanged) {
        loadEmails();
    }
    
    // Update refresh timer
    startRefreshTimer();
    
    // Close modal
    closeSettingsModal();
}

// Compose Email Functions
function openComposeModal() {
    // Clear form
    const composeData = {
        to: '',
        cc: '',
        subject: '',
        body: '',
        attachments: []
    };
    
    // Show compose view in detail area
    renderComposeView(composeData);
    
    // Clear selected email
    const emailItems = document.querySelectorAll('.email-item');
    emailItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    // For mobile view, switch to detail view
    if (isMobileView) {
        document.querySelector('.widget-container').classList.add('mobile-view');
    }
}

function closeComposeModal() {
    // Show empty email detail view
    emailDetailContainer.innerHTML = `
        <div class="no-email-selected">
            <i class="far fa-envelope"></i>
            <p>Select an email to view</p>
        </div>
    `;
}

function renderComposeView(data) {
    // For mobile view, add back button
    const backButtonHtml = isMobileView ? `
        <div class="back-button" id="back-to-list">
            <i class="fas fa-arrow-left"></i> Back
        </div>
    ` : '';
    
    // Render the compose view in the email detail area
    emailDetailContainer.innerHTML = `
        ${backButtonHtml}
        <div class="compose-view">
            <div class="compose-header">
                <h2>Compose Email</h2>
                <button id="close-compose-btn" class="close-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="compose-content">
                <div class="compose-group">
                    <label for="inline-compose-to">To:</label>
                    <input type="text" id="inline-compose-to" placeholder="recipient@example.com" value="${data.to || ''}">
                </div>
                <div class="compose-group">
                    <label for="inline-compose-cc">Cc:</label>
                    <input type="text" id="inline-compose-cc" placeholder="cc@example.com" value="${data.cc || ''}">
                </div>
                <div class="compose-group">
                    <label for="inline-compose-subject">Subject:</label>
                    <input type="text" id="inline-compose-subject" placeholder="Subject" value="${data.subject || ''}">
                </div>
                <div class="compose-group">
                    <label for="inline-compose-body">Message:</label>
                    <textarea id="inline-compose-body" placeholder="Type your message here...">${data.body || ''}</textarea>
                </div>
                <div class="compose-group">
                    <label for="inline-compose-attachments">Attachments:</label>
                    <input type="file" id="inline-compose-attachments" multiple>
                    <div id="inline-attachment-list"></div>
                </div>
            </div>
            <div class="compose-footer">
                <button id="inline-send-email" class="send-btn">Send</button>
            </div>
        </div>
    `;
    
    // Set up event listeners for the compose view
    document.getElementById('close-compose-btn').addEventListener('click', closeComposeModal);
    document.getElementById('inline-compose-attachments').addEventListener('change', handleInlineComposeAttachments);
    document.getElementById('inline-send-email').addEventListener('click', sendInlineEmail);
    
    // Add event listener for back button in mobile view
    if (isMobileView) {
        document.getElementById('back-to-list').addEventListener('click', backToList);
    }
    
    // Render existing attachments if any
    if (data.attachments && data.attachments.length > 0) {
        composeAttachments = [...data.attachments];
        renderInlineComposeAttachments();
    } else {
        composeAttachments = [];
    }
}

function handleInlineComposeAttachments(event) {
    const files = event.target.files;
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Add to attachments array
        composeAttachments.push({
            file: file,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.name.split('.').pop()
        });
    }
    
    // Render attachments
    renderInlineComposeAttachments();
}

function renderInlineComposeAttachments() {
    // Clear attachment list
    const attachmentList = document.getElementById('inline-attachment-list');
    if (!attachmentList) return;
    
    attachmentList.innerHTML = '';
    
    // Add each attachment
    composeAttachments.forEach((attachment, index) => {
        const attachmentElement = document.createElement('div');
        attachmentElement.classList.add('attachment-preview');
        
        // Get appropriate icon
        const icon = getAttachmentIcon(attachment.type);
        
        // Create attachment HTML
        attachmentElement.innerHTML = `
            <i class="fas ${icon}"></i>
            ${attachment.name} (${attachment.size})
            <button type="button" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listener to remove button
        attachmentElement.querySelector('button').addEventListener('click', () => {
            composeAttachments.splice(index, 1);
            renderInlineComposeAttachments();
        });
        
        // Add to container
        attachmentList.appendChild(attachmentElement);
    });
}

function sendInlineEmail() {
    // Get values
    const to = document.getElementById('inline-compose-to').value.trim();
    const cc = document.getElementById('inline-compose-cc').value.trim();
    const subject = document.getElementById('inline-compose-subject').value.trim();
    const body = document.getElementById('inline-compose-body').value.trim();
    
    // Validate form
    if (!to) {
        alert('Please enter a recipient');
        return;
    }
    
    if (!subject) {
        alert('Please enter a subject');
        return;
    }
    
    if (!body) {
        alert('Please enter a message');
        return;
    }
    
    // Mock sending email
    alert(`Sending email to ${to}...`);
    
    // Close compose view
    closeComposeModal();
    
    // Show success message
    setTimeout(() => {
        alert('Email sent successfully!');
    }, 1000);
}

// Reply Email Functions
function replyEmail(replyAll) {
    if (!selectedEmail) return;
    
    // Set reply data
    const subject = selectedEmail.subject;
    const formattedSubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
    const date = selectedEmail.date.toLocaleString();
    const quotedText = `\n\n-------------------\nOn ${date}, ${selectedEmail.sender} <${selectedEmail.senderEmail}> wrote:\n\n${selectedEmail.body}`;
    
    const replyData = {
        to: `${selectedEmail.sender} <${selectedEmail.senderEmail}>`,
        cc: replyAll ? 'me@example.com' : '',
        subject: formattedSubject,
        body: '\n' + quotedText,
        attachments: []
    };
    
    // Render compose view with reply data
    renderComposeView(replyData);
    
    // Set the cursor at the beginning of the body
    setTimeout(() => {
        const bodyField = document.getElementById('inline-compose-body');
        if (bodyField) {
            bodyField.focus();
            bodyField.selectionStart = 0;
            bodyField.selectionEnd = 0;
        }
    }, 100);
}

function forwardEmail() {
    if (!selectedEmail) return;
    
    // Set forward data
    const subject = selectedEmail.subject;
    const formattedSubject = subject.startsWith('Fwd:') ? subject : `Fwd: ${subject}`;
    const date = selectedEmail.date.toLocaleString();
    const forwardedText = `\n\n-------------------\nForwarded Message\nFrom: ${selectedEmail.sender} <${selectedEmail.senderEmail}>\nDate: ${date}\nSubject: ${selectedEmail.subject}\nTo: me@example.com\n\n${selectedEmail.body}`;
    
    const forwardData = {
        to: '',
        cc: '',
        subject: formattedSubject,
        body: '\n' + forwardedText,
        attachments: selectedEmail.attachments ? [...selectedEmail.attachments] : []
    };
    
    // Render compose view with forward data
    renderComposeView(forwardData);
    
    // Set the cursor at the beginning of the body
    setTimeout(() => {
        const bodyField = document.getElementById('inline-compose-body');
        if (bodyField) {
            bodyField.focus();
            bodyField.selectionStart = 0;
            bodyField.selectionEnd = 0;
        }
    }, 100);
}

function closeReplyModal() {
    replyModal.style.display = 'none';
}

function handleReplyAttachments(event) {
    const files = event.target.files;
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Add to attachments array
        replyAttachments.push({
            file: file,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.name.split('.').pop()
        });
    }
    
    // Render attachments
    renderReplyAttachments();
}

function renderReplyAttachments() {
    // Clear attachment list
    replyAttachmentList.innerHTML = '';
    
    // Add each attachment
    replyAttachments.forEach((attachment, index) => {
        const attachmentElement = document.createElement('div');
        attachmentElement.classList.add('attachment-preview');
        
        // Get appropriate icon
        const icon = getAttachmentIcon(attachment.type);
        
        // Create attachment HTML
        attachmentElement.innerHTML = `
            <i class="fas ${icon}"></i>
            ${attachment.name} (${attachment.size})
            <button type="button" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listener to remove button
        attachmentElement.querySelector('button').addEventListener('click', () => {
            replyAttachments.splice(index, 1);
            renderReplyAttachments();
        });
        
        // Add to container
        replyAttachmentList.appendChild(attachmentElement);
    });
}

function sendReply() {
    // Get values
    const to = replyTo.value.trim();
    const cc = replyCc.value.trim();
    const subject = replySubject.value.trim();
    const body = replyBody.value.trim();
    
    // Validate form
    if (!to) {
        alert('Please enter a recipient');
        return;
    }
    
    // Mock sending email
    alert(`Sending email to ${to}...`);
    
    // Close modal
    closeReplyModal();
    
    // Show success message
    setTimeout(() => {
        alert('Email sent successfully!');
    }, 1000);
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
}

// Handle mobile tab switching
function switchMobileTab(tabName) {
    console.log(`Switching to tab: ${tabName}`);
    
    // Update active tab
    const tabs = document.querySelectorAll('.mobile-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
    
    // Reset view to show email list
    document.querySelector('.widget-container').classList.remove('mobile-view');
    
    // Clear email selection
    selectedEmail = null;
    
    // For demo, only inbox has emails
    if (tabName === 'inbox') {
        // Show inbox emails
        console.log('Loading inbox emails');
        loadEmails();
    } else {
        // Show empty state for other tabs
        console.log(`Showing empty state for ${tabName}`);
        filteredEmails = [];
        renderEmptyTabState(tabName);
    }
}

// Render empty state for non-inbox tabs
function renderEmptyTabState(tabName) {
    // Preserve search field
    const searchContainer = emailListContainer.querySelector('.search-container');
    
    // Clear email list
    emailListContainer.innerHTML = '';
    
    // Add search container back
    if (searchContainer) {
        emailListContainer.appendChild(searchContainer);
    }
    
    // Show empty state message
    const emptyState = document.createElement('div');
    emptyState.className = 'no-results';
    
    let message = '';
    let icon = '';
    
    if (tabName === 'sent') {
        message = 'No sent emails';
        icon = 'fa-paper-plane';
    } else if (tabName === 'drafts') {
        message = 'No drafts';
        icon = 'fa-file';
    }
    
    emptyState.innerHTML = `
        <div class="no-emails-message">
            <i class="fas ${icon}"></i>
            <p>${message}</p>
        </div>
    `;
    
    emailListContainer.appendChild(emptyState);
    
    // Update footer count
    emailCountDisplay.textContent = '0 emails';
}

// Initialize the widget when the DOM is loaded
document.addEventListener('DOMContentLoaded', initWidget); 