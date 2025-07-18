// public/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const applicationsList = document.getElementById('applications-list');
    const loadingMessage = document.getElementById('loading-message');
    const noApplicationsMessage = document.getElementById('no-applications-message');
    const messageBox = document.getElementById('message-box');
    const logoutButton = document.getElementById('logout-button-admin');

    // Search elements
    const applicationSearchInput = document.getElementById('application-search-input');
    const searchButton = document.getElementById('search-button');

    // Tab buttons and sections
    const showApplicationsBtn = document.getElementById('show-applications-btn');
    const showModeratorsBtn = document.getElementById('show-moderators-btn'); // NEW
    const showAdminsBtn = document.getElementById('show-admins-btn');
    const showBlacklistBtn = document.getElementById('show-blacklist-btn');
    const applicationsSection = document.getElementById('applications-section');
    const moderatorsSection = document.getElementById('moderators-section'); // NEW
    const adminsSection = document.getElementById('admins-section');
    const blacklistSection = document.getElementById('blacklist-section');

    // Admin management elements
    const addAdminIdInput = document.getElementById('add-admin-id');
    const addAdminUsernameInput = document.getElementById('add-admin-username');
    const addAdminBtn = document.getElementById('add-admin-btn');
    const adminsList = document.getElementById('admins-list');

    // Moderator management elements (NEW)
    const addModeratorIdInput = document.getElementById('add-moderator-id');
    const addModeratorUsernameInput = document.getElementById('add-moderator-username');
    const addModeratorBtn = document.getElementById('add-moderator-btn');
    const moderatorsList = document.getElementById('moderators-list');

    // Blacklist management elements
    const addBlacklistIdInput = document.getElementById('add-blacklist-id');
    const addBlacklistUsernameInput = document.getElementById('add-blacklist-username');
    const addBlacklistReasonInput = document.getElementById('add-blacklist-reason');
    const addBlacklistBtn = document.getElementById('add-blacklist-btn');
    const blacklistList = document.getElementById('blacklist-list');

    // Modal elements
    const applicationModal = document.getElementById('application-modal');
    const modalCloseButton = document.querySelector('.modal-close-button');
    const modalApplicantName = document.getElementById('modal-applicant-name');
    const modalDiscordId = document.getElementById('modal-discord-id');
    const modalAppType = document.getElementById('modal-app-type');
    const modalAnswers = document.getElementById('modal-answers');
    const acceptButton = document.getElementById('accept-button');
    const rejectButton = document.getElementById('reject-button');
    const deleteButton = document.getElementById('delete-button');
    const modalStatus = document.getElementById('modal-status');
    const modalReviewerInfo = document.getElementById('modal-reviewer-info');
    const modalReviewDate = document.getElementById('modal-review-date');
    const modalReviewReasonContainer = document.getElementById('modal-review-reason-container');
    const modalReviewReasonInput = document.getElementById('modal-review-reason');

    let currentApplicationId = null; // To keep track of the application being viewed in the modal
    let currentUserIsAdmin = false; // To store current user's admin status
    let currentUserIsModerator = false; // To store current user's moderator status

    // Function to display messages to the user
    function showMessage(message, type = 'info') {
        messageBox.textContent = message;
        messageBox.className = `mt-6 p-4 rounded-lg text-center ${type}`; // Apply Tailwind classes
        messageBox.style.display = 'block';

        // Automatically hide after 5 seconds
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }

    // Function to fetch and verify session info (especially admin/moderator status)
    async function fetchSessionAndVerifyRoles() {
        try {
            const response = await fetch('/api/session');
            if (!response.ok) {
                showMessage('Session expired. Please log in again.', 'error');
                setTimeout(() => { window.location.href = '/'; }, 2000);
                return false;
            }
            const data = await response.json();
            if (data.success && data.user) {
                currentUserIsAdmin = data.user.isAdmin;
                currentUserIsModerator = data.user.isModerator; // Get moderator status

                // If neither admin nor moderator, redirect
                if (!currentUserIsAdmin && !currentUserIsModerator) {
                    showMessage('Access denied. You are not authorized to view this page.', 'error');
                    setTimeout(() => { window.location.href = '/apply.html'; }, 2000);
                    return false;
                }
                // Hide admin-only tabs for moderators
                if (!currentUserIsAdmin) {
                    showAdminsBtn.style.display = 'none';
                    showBlacklistBtn.style.display = 'none';
                    // If a moderator somehow lands on an admin-only tab, redirect to applications
                    if (adminsSection.classList.contains('hidden') === false || blacklistSection.classList.contains('hidden') === false) {
                        showSection('applications');
                    }
                } else {
                    // Ensure admin-only tabs are visible for admins
                    showAdminsBtn.style.display = 'inline-block';
                    showBlacklistBtn.style.display = 'inline-block';
                }
                return true;
            } else {
                showMessage('Access denied. You are not authorized to view this page.', 'error');
                setTimeout(() => { window.location.href = '/apply.html'; }, 2000);
                return false;
            }
        } catch (error) {
            console.error('Error fetching session info:', error);
            showMessage('Network error or session issue. Please try logging in again.', 'error');
            setTimeout(() => { window.location.href = '/'; }, 2000);
            return false;
        }
    }

    // --- Tab Management ---
    function showSection(sectionId) {
        // Hide all sections
        applicationsSection.classList.add('hidden');
        moderatorsSection.classList.add('hidden'); // NEW
        adminsSection.classList.add('hidden');
        blacklistSection.classList.add('hidden');

        // Deactivate all buttons
        showApplicationsBtn.classList.remove('bg-green-700', 'hover:bg-green-600');
        showApplicationsBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        showModeratorsBtn.classList.remove('bg-green-700', 'hover:bg-green-600'); // NEW
        showModeratorsBtn.classList.add('bg-gray-700', 'hover:bg-gray-600'); // NEW
        showAdminsBtn.classList.remove('bg-green-700', 'hover:bg-green-600');
        showAdminsBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');
        showBlacklistBtn.classList.remove('bg-green-700', 'hover:bg-green-600');
        showBlacklistBtn.classList.add('bg-gray-700', 'hover:bg-gray-600');

        // Show target section and activate its button
        switch (sectionId) {
            case 'applications':
                applicationsSection.classList.remove('hidden');
                showApplicationsBtn.classList.add('bg-green-700', 'hover:bg-green-600');
                showApplicationsBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                fetchApplications(); // Refresh applications when showing this tab
                break;
            case 'moderators': // NEW
                if (!currentUserIsAdmin) { // Only admins can see this tab
                    showMessage('Access denied. Only administrators can manage moderators.', 'error');
                    showSection('applications'); // Redirect to applications if unauthorized
                    return;
                }
                moderatorsSection.classList.remove('hidden');
                showModeratorsBtn.classList.add('bg-green-700', 'hover:bg-green-600');
                showModeratorsBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                fetchModerators(); // Refresh moderators when showing this tab
                break;
            case 'admins':
                if (!currentUserIsAdmin) { // Only admins can see this tab
                    showMessage('Access denied. Only administrators can manage admins.', 'error');
                    showSection('applications'); // Redirect to applications if unauthorized
                    return;
                }
                adminsSection.classList.remove('hidden');
                showAdminsBtn.classList.add('bg-green-700', 'hover:bg-green-600');
                showAdminsBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                fetchAdmins(); // Refresh admins when showing this tab
                break;
            case 'blacklist':
                if (!currentUserIsAdmin) { // Only admins can see this tab
                    showMessage('Access denied. Only administrators can manage the blacklist.', 'error');
                    showSection('applications'); // Redirect to applications if unauthorized
                    return;
                }
                blacklistSection.classList.remove('hidden');
                showBlacklistBtn.classList.add('bg-green-700', 'hover:bg-green-600');
                showBlacklistBtn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                fetchBlacklistedUsers(); // Refresh blacklist when showing this tab
                break;
        }
    }

    // --- Application List Functions ---
    function renderApplicationCard(app) {
        const appCard = document.createElement('div');
        appCard.className = 'bg-gray-700 p-6 rounded-lg shadow-md flex flex-col md:flex-row items-center justify-between cursor-pointer hover:bg-gray-600 transition duration-200';
        appCard.dataset.applicationId = app._id; // Use _id from MongoDB

        const userInfo = document.createElement('div');
        userInfo.className = 'flex items-center mb-4 md:mb-0';
        if (app.avatar) {
            const avatarImg = document.createElement('img');
            avatarImg.src = app.avatar;
            avatarImg.alt = `${app.username}'s avatar`;
            avatarImg.className = 'w-12 h-12 rounded-full mr-4 border-2 border-green-500';
            userInfo.appendChild(avatarImg);
        }
        const nameAndType = document.createElement('div');
        nameAndType.innerHTML = `<p class="text-xl font-semibold text-green-300">${app.username}</p><p class="text-gray-400 text-sm">${app.applicationType.charAt(0).toUpperCase() + app.applicationType.slice(1)} Application</p>`;
        userInfo.appendChild(nameAndType);
        appCard.appendChild(userInfo);

        const statusInfo = document.createElement('div');
        statusInfo.className = 'flex items-center';
        const statusSpan = document.createElement('span');
        statusSpan.className = `px-3 py-1 rounded-full text-sm font-semibold ${
            app.status === 'pending' ? 'bg-yellow-500 text-yellow-900' :
            app.status === 'accepted' ? 'bg-green-500 text-green-900' :
            'bg-red-500 text-red-900'
        }`;
        statusSpan.textContent = app.status.charAt(0).toUpperCase() + app.status.slice(1);
        statusInfo.appendChild(statusSpan);
        appCard.appendChild(statusInfo);

        appCard.addEventListener('click', () => openApplicationModal(app));
        return appCard;
    }

    async function fetchApplications(applicationId = null) {
        const hasAccess = await fetchSessionAndVerifyRoles(); // Verify roles before fetching
        if (!hasAccess) {
            loadingMessage.style.display = 'none';
            return;
        }

        loadingMessage.style.display = 'block';
        applicationsList.innerHTML = ''; // Clear previous list
        noApplicationsMessage.style.display = 'none';
        showMessage('', 'hidden'); // Clear any previous messages

        let url = '/api/applications'; // Default to fetching pending applications
        if (applicationId) {
            url = `/api/applications/${applicationId}`; // Override to fetch specific ID
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404 && applicationId) {
                    showMessage(`Application with ID "${applicationId}" not found.`, 'error');
                } else if (response.status === 400 && applicationId) {
                    showMessage('Invalid application ID format.', 'error');
                } else if (response.status === 403) {
                    showMessage('Access denied. You are not authorized to view this page.', 'error');
                    setTimeout(() => { window.location.href = '/apply.html'; }, 2000);
                } else if (response.status === 401) {
                    showMessage('Session expired. Please log in again.', 'error');
                    setTimeout(() => { window.location.href = '/'; }, 2000);
                }
                throw new Error('Failed to fetch applications: ' + response.statusText);
            }
            const data = await response.json();

            loadingMessage.style.display = 'none';

            if (data.success) {
                let appsToDisplay = [];
                if (applicationId) { // If searching for a single app
                    if (data.application) {
                        appsToDisplay.push(data.application);
                        // Automatically open modal for single search result
                        openApplicationModal(data.application);
                    }
                } else { // If fetching all pending apps
                    appsToDisplay = data.applications;
                }

                if (appsToDisplay.length > 0) {
                    appsToDisplay.forEach(app => {
                        applicationsList.appendChild(renderApplicationCard(app));
                    });
                } else {
                    noApplicationsMessage.style.display = 'block';
                }
            } else {
                showMessage(`Failed to load applications: ${data.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
            loadingMessage.style.display = 'none';
            if (!applicationId || (error.message && !error.message.includes('not found') && !error.message.includes('Invalid application ID'))) {
                 showMessage('Failed to load applications. Please try again.', 'error');
            }
        }
    }

    // --- Application Modal Functions ---
    function openApplicationModal(app) {
        currentApplicationId = app._id;
        modalApplicantName.textContent = app.username;
        modalDiscordId.textContent = app.discordId;
        modalAppType.textContent = app.applicationType.charAt(0).toUpperCase() + app.applicationType.slice(1);
        modalStatus.textContent = `Status: ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}`;
        modalStatus.className = `mt-4 text-right text-lg font-semibold ${
            app.status === 'pending' ? 'text-yellow-400' :
            app.status === 'accepted' ? 'text-green-400' :
            'text-red-400'
        }`;

        modalAnswers.innerHTML = '';
        for (const questionId in app.answers) {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'bg-gray-700 p-3 rounded-md';
            const formattedQuestionId = questionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            answerDiv.innerHTML = `<p class="font-semibold text-gray-300">${formattedQuestionId}:</p><p class="text-gray-200 whitespace-pre-wrap">${app.answers[questionId]}</p>`;
            modalAnswers.appendChild(answerDiv);
        }

        // Display reviewer info if available
        if (app.reviewedByUsername && app.reviewedByDiscordId && app.reviewTimestamp) {
            modalReviewerInfo.textContent = `Reviewed By: ${app.reviewedByUsername} (${app.reviewedByDiscordId})`;
            modalReviewDate.textContent = `Review Date: ${new Date(app.reviewTimestamp).toLocaleString()}`;
            modalReviewerInfo.style.display = 'block';
            modalReviewDate.style.display = 'block';
        } else {
            modalReviewerInfo.style.display = 'none';
            modalReviewDate.style.display = 'none';
            modalReviewerInfo.textContent = '';
            modalReviewDate.textContent = '';
        }

        // Handle review reason input/display and permissions
        if (app.status === 'pending' && currentUserIsAdmin) { // Only admins can edit reason for pending apps
            modalReviewReasonContainer.style.display = 'block';
            modalReviewReasonInput.value = app.reviewReason || ''; // Pre-fill if exists
            modalReviewReasonInput.readOnly = false; // Make editable
            modalReviewReasonInput.classList.remove('opacity-70', 'cursor-not-allowed');
        } else if (app.reviewReason) { // Display reason if exists for reviewed apps (read-only for all)
            modalReviewReasonContainer.style.display = 'block';
            modalReviewReasonInput.value = app.reviewReason;
            modalReviewReasonInput.readOnly = true; // Make read-only
            modalReviewReasonInput.classList.add('opacity-70', 'cursor-not-allowed');
        } else { // Hide reason if no reason and not pending/admin
            modalReviewReasonContainer.style.display = 'none';
            modalReviewReasonInput.value = '';
        }

        // Disable Accept/Reject/Delete buttons based on status AND user role
        acceptButton.disabled = (app.status !== 'pending' || !currentUserIsAdmin);
        rejectButton.disabled = (app.status !== 'pending' || !currentUserIsAdmin);
        deleteButton.disabled = !currentUserIsAdmin; // Only admins can delete

        applicationModal.classList.remove('hidden');
    }

    function closeApplicationModal() {
        applicationModal.classList.add('hidden');
        currentApplicationId = null;
        modalReviewReasonInput.value = ''; // Clear reason input on close
    }

    async function updateApplicationStatus(status) {
        if (!currentApplicationId) {
            console.error('No application ID set for status update.');
            showMessage('Error: No application selected.', 'error');
            return;
        }
        if (!currentUserIsAdmin) { // Double-check on client-side
            showMessage('You do not have permission to accept or reject applications.', 'error');
            return;
        }

        const reviewReason = modalReviewReasonInput.value.trim();

        acceptButton.disabled = true;
        rejectButton.disabled = true;
        deleteButton.disabled = true;
        showMessage(`Updating status to ${status}...`, 'info');

        try {
            const response = await fetch(`/api/applications/${currentApplicationId}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: status, reviewReason: reviewReason }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage(`Application status updated to ${status}.`, 'success');
                closeApplicationModal();
                fetchApplications(); // Refresh the list
            } else {
                showMessage(`Failed to update status: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
                console.error('Error updating application status:', error);
                showMessage('Network error while updating status. Please try again.', 'error');
        } finally {
            acceptButton.disabled = false;
            rejectButton.disabled = false;
            deleteButton.disabled = false;
        }
    }

    async function deleteApplication() {
        if (!currentApplicationId) {
            console.error('No application ID set for deletion.');
            showMessage('Error: No application selected.', 'error');
            return;
        }
        if (!currentUserIsAdmin) { // Double-check on client-side
            showMessage('You do not have permission to delete applications.', 'error');
            return;
        }

        const confirmDelete = window.confirm('Are you sure you want to delete this application? This action cannot be undone.');

        if (!confirmDelete) {
            return; // User cancelled
        }

        acceptButton.disabled = true;
        rejectButton.disabled = true;
        deleteButton.disabled = true;
        showMessage('Deleting application...', 'info');

        try {
            const response = await fetch(`/api/applications/${currentApplicationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (response.ok && result.success) {
                showMessage('Application deleted successfully!', 'success');
                closeApplicationModal();
                fetchApplications(); // Refresh the list
            } else {
                showMessage(`Failed to delete application: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting application:', error);
            showMessage('Network error while deleting application. Please try again.', 'error');
        } finally {
            acceptButton.disabled = false;
            rejectButton.disabled = false;
            deleteButton.disabled = false;
        }
    }

    // --- Admin Management Functions ---
    async function fetchAdmins() {
        adminsList.innerHTML = '<p class="text-gray-400 text-center">Loading admins...</p>';
        try {
            const response = await fetch('/api/admins');
            if (!response.ok) {
                throw new Error('Failed to fetch admins: ' + response.statusText);
            }
            const data = await response.json();
            if (data.success && data.admins.length > 0) {
                adminsList.innerHTML = ''; // Clear loading message
                data.admins.forEach(admin => {
                    adminsList.appendChild(renderAdminCard(admin));
                });
            } else {
                adminsList.innerHTML = '<p class="text-gray-400 text-center">No admins found.</p>';
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
            showMessage('Failed to load admins. Please try again.', 'error');
            adminsList.innerHTML = '<p class="text-red-400 text-center">Error loading admins.</p>';
        }
    }

    function renderAdminCard(admin) {
        const adminCard = document.createElement('div');
        adminCard.className = 'bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between';
        adminCard.innerHTML = `
            <div>
                <p class="text-lg font-semibold text-green-300">${admin.username}</p>
                <p class="text-gray-400 text-sm">ID: ${admin.discordId}</p>
                ${admin.addedByUsername ? `<p class="text-gray-500 text-xs">Added by: ${admin.addedByUsername}</p>` : ''}
            </div>
            <button class="remove-admin-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-4 rounded-full text-sm transition duration-300 ease-in-out" data-discord-id="${admin.discordId}">Remove</button>
        `;
        adminCard.querySelector('.remove-admin-btn').addEventListener('click', (e) => removeAdmin(e.target.dataset.discordId));
        return adminCard;
    }

    async function addAdmin() {
        const discordId = addAdminIdInput.value.trim();
        const username = addAdminUsernameInput.value.trim();

        if (!discordId || !username) {
            showMessage('Discord ID and Username are required to add an admin.', 'error');
            return;
        }

        addAdminBtn.disabled = true;
        showMessage('Adding admin...', 'info');

        try {
            const response = await fetch('/api/admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discordId, username })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showMessage('Admin added successfully!', 'success');
                addAdminIdInput.value = '';
                addAdminUsernameInput.value = '';
                fetchAdmins(); // Refresh the list
            } else {
                showMessage(`Failed to add admin: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error adding admin:', error);
            showMessage('Network error while adding admin. Please try again.', 'error');
        } finally {
            addAdminBtn.disabled = false;
        }
    }

    async function removeAdmin(discordId) {
        const confirmRemove = window.confirm(`Are you sure you want to remove admin ${discordId}?`);
        if (!confirmRemove) return;

        showMessage('Removing admin...', 'info');
        try {
            const response = await fetch(`/api/admins/${discordId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showMessage('Admin removed successfully!', 'success');
                fetchAdmins(); // Refresh the list
            } else {
                showMessage(`Failed to remove admin: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error removing admin:', error);
            showMessage('Network error while removing admin. Please try again.', 'error');
        }
    }

    // --- Moderator Management Functions (NEW) ---
    async function fetchModerators() {
        moderatorsList.innerHTML = '<p class="text-gray-400 text-center">Loading moderators...</p>';
        try {
            const response = await fetch('/api/moderators');
            if (!response.ok) {
                throw new Error('Failed to fetch moderators: ' + response.statusText);
            }
            const data = await response.json();
            if (data.success && data.moderators.length > 0) {
                moderatorsList.innerHTML = ''; // Clear loading message
                data.moderators.forEach(moderator => {
                    moderatorsList.appendChild(renderModeratorCard(moderator));
                });
            } else {
                moderatorsList.innerHTML = '<p class="text-gray-400 text-center">No moderators found.</p>';
            }
        } catch (error) {
            console.error('Error fetching moderators:', error);
            showMessage('Failed to load moderators. Please try again.', 'error');
            moderatorsList.innerHTML = '<p class="text-red-400 text-center">Error loading moderators.</p>';
        }
    }

    function renderModeratorCard(moderator) {
        const moderatorCard = document.createElement('div');
        moderatorCard.className = 'bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between';
        moderatorCard.innerHTML = `
            <div>
                <p class="text-lg font-semibold text-blue-300">${moderator.username}</p>
                <p class="text-gray-400 text-sm">ID: ${moderator.discordId}</p>
                ${moderator.addedByUsername ? `<p class="text-gray-500 text-xs">Added by: ${moderator.addedByUsername}</p>` : ''}
            </div>
            <button class="remove-moderator-btn bg-red-600 hover:bg-red-700 text-white font-semibold py-1.5 px-4 rounded-full text-sm transition duration-300 ease-in-out" data-discord-id="${moderator.discordId}">Remove</button>
        `;
        moderatorCard.querySelector('.remove-moderator-btn').addEventListener('click', (e) => removeModerator(e.target.dataset.discordId));
        return moderatorCard;
    }

    async function addModerator() {
        const discordId = addModeratorIdInput.value.trim();
        const username = addModeratorUsernameInput.value.trim();

        if (!discordId || !username) {
            showMessage('Discord ID and Username are required to add a moderator.', 'error');
            return;
        }

        addModeratorBtn.disabled = true;
        showMessage('Adding moderator...', 'info');

        try {
            const response = await fetch('/api/moderators', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discordId, username })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showMessage('Moderator added successfully!', 'success');
                addModeratorIdInput.value = '';
                addModeratorUsernameInput.value = '';
                fetchModerators(); // Refresh the list
            } else {
                showMessage(`Failed to add moderator: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error adding moderator:', error);
            showMessage('Network error while adding moderator. Please try again.', 'error');
        } finally {
            addModeratorBtn.disabled = false;
        }
    }

    async function removeModerator(discordId) {
        const confirmRemove = window.confirm(`Are you sure you want to remove moderator ${discordId}?`);
        if (!confirmRemove) return;

        showMessage('Removing moderator...', 'info');
        try {
            const response = await fetch(`/api/moderators/${discordId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showMessage('Moderator removed successfully!', 'success');
                fetchModerators(); // Refresh the list
            } else {
                showMessage(`Failed to remove moderator: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error removing moderator:', error);
            showMessage('Network error while removing moderator. Please try again.', 'error');
        }
    }

    // --- Blacklist Management Functions ---
    async function fetchBlacklistedUsers() {
        blacklistList.innerHTML = '<p class="text-gray-400 text-center">Loading blacklisted users...</p>';
        try {
            const response = await fetch('/api/blacklist');
            if (!response.ok) {
                throw new Error('Failed to fetch blacklisted users: ' + response.statusText);
            }
            const data = await response.json();
            if (data.success && data.blacklistedUsers.length > 0) {
                blacklistList.innerHTML = ''; // Clear loading message
                data.blacklistedUsers.forEach(user => {
                    blacklistList.appendChild(renderBlacklistedUserCard(user));
                });
            } else {
                blacklistList.innerHTML = '<p class="text-gray-400 text-center">No blacklisted users found.</p>';
            }
        } catch (error) {
            console.error('Error fetching blacklisted users:', error);
            showMessage('Failed to load blacklisted users. Please try again.', 'error');
            blacklistList.innerHTML = '<p class="text-red-400 text-center">Error loading blacklisted users.</p>';
        }
    }

    function renderBlacklistedUserCard(user) {
        const userCard = document.createElement('div');
        userCard.className = 'bg-gray-700 p-4 rounded-lg shadow-md flex items-center justify-between';
        userCard.innerHTML = `
            <div>
                <p class="text-lg font-semibold text-red-300">${user.username}</p>
                <p class="text-gray-400 text-sm">ID: ${user.discordId}</p>
                ${user.reason ? `<p class="text-gray-500 text-xs">Reason: ${user.reason}</p>` : ''}
                ${user.blacklistedByUsername ? `<p class="text-gray-500 text-xs">Blacklisted by: ${user.blacklistedByUsername}</p>` : ''}
            </div>
            <button class="remove-blacklist-btn bg-green-600 hover:bg-green-700 text-white font-semibold py-1.5 px-4 rounded-full text-sm transition duration-300 ease-in-out" data-discord-id="${user.discordId}">Remove</button>
        `;
        userCard.querySelector('.remove-blacklist-btn').addEventListener('click', (e) => removeBlacklistedUser(e.target.dataset.discordId));
        return userCard;
    }

    async function addBlacklistedUser() {
        const discordId = addBlacklistIdInput.value.trim();
        const username = addBlacklistUsernameInput.value.trim();
        const reason = addBlacklistReasonInput.value.trim();

        if (!discordId || !username) {
            showMessage('Discord ID and Username are required to blacklist a user.', 'error');
            return;
        }

        addBlacklistBtn.disabled = true;
        showMessage('Blacklisting user...', 'info');

        try {
            const response = await fetch('/api/blacklist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discordId, username, reason })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showMessage('User blacklisted successfully!', 'success');
                addBlacklistIdInput.value = '';
                addBlacklistUsernameInput.value = '';
                addBlacklistReasonInput.value = '';
                fetchBlacklistedUsers(); // Refresh the list
            } else {
                showMessage(`Failed to blacklist user: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error blacklisting user:', error);
            showMessage('Network error while blacklisting user. Please try again.', 'error');
        } finally {
            addBlacklistBtn.disabled = false;
        }
    }

    async function removeBlacklistedUser(discordId) {
        const confirmRemove = window.confirm(`Are you sure you want to remove user ${discordId} from the blacklist?`);
        if (!confirmRemove) return;

        showMessage('Removing user from blacklist...', 'info');
        try {
            const response = await fetch(`/api/blacklist/${discordId}`, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (response.ok && result.success) {
                showMessage('User removed from blacklist successfully!', 'success');
                fetchBlacklistedUsers(); // Refresh the list
            } else {
                showMessage(`Failed to remove user from blacklist: ${result.message || 'Unknown error.'}`, 'error');
            }
        } catch (error) {
            console.error('Error removing blacklisted user:', error);
            showMessage('Network error while removing blacklisted user. Please try again.', 'error');
        }
    }


    // --- Event Listeners ---
    modalCloseButton.addEventListener('click', closeApplicationModal);
    applicationModal.addEventListener('click', (e) => {
        if (e.target === applicationModal) {
            closeApplicationModal();
        }
    });
    acceptButton.addEventListener('click', () => updateApplicationStatus('accepted'));
    rejectButton.addEventListener('click', () => updateApplicationStatus('rejected'));
    deleteButton.addEventListener('click', deleteApplication);

    // Search event listener
    searchButton.addEventListener('click', () => {
        const searchTerm = applicationSearchInput.value.trim();
        if (searchTerm) {
            fetchApplications(searchTerm);
        } else {
            fetchApplications();
        }
    });

    // Tab button event listeners
    showApplicationsBtn.addEventListener('click', () => showSection('applications'));
    showModeratorsBtn.addEventListener('click', () => showSection('moderators')); // NEW
    showAdminsBtn.addEventListener('click', () => showSection('admins'));
    showBlacklistBtn.addEventListener('click', () => showSection('blacklist'));

    // Admin management button listeners
    addAdminBtn.addEventListener('click', addAdmin);

    // Moderator management button listeners (NEW)
    addModeratorBtn.addEventListener('click', addModerator);

    // Blacklist management button listeners
    addBlacklistBtn.addEventListener('click', addBlacklistedUser);


    // Handle logout
    logoutButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/auth/logout');
            if (response.ok) {
                window.location.href = '/';
            } else {
                showMessage('Failed to log out. Please try again.', 'error');
            }
        } catch (error) {
                console.error('Error during logout:', error);
                showMessage('Network error during logout. Please try again.', 'error');
        }
    });

    // Initial load: Fetch roles and then show applications section by default
    fetchSessionAndVerifyRoles().then(hasAccess => {
        if (hasAccess) {
            showSection('applications');
        }
    });
});
