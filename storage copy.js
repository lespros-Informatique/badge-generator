// Storage utility for managing members data with JSONBin.io
// Centralized cloud storage - all inscriptions go to the same database

const STORAGE_KEY = 'badge_members_cache'; // Local cache

// Generate unique ID
function generateId() {
    return 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================
// JSONBIN.IO API FUNCTIONS
// ============================================

// Fetch all members from JSONBin.io
async function fetchMembersFromCloud() {
    try {
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_CONFIG.API_KEY,
                'X-Bin-Meta': 'false'
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des données');
        }

        const data = await response.json();

        // Cache locally
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        return data.members || [];
    } catch (error) {
        console.error('Erreur cloud:', error);
        // Fallback to local cache
        return getAllMembersLocal();
    }
}

// Save members to JSONBin.io
async function saveMembersToCloud(members) {
    try {
        const data = {
            members: members,
            lastUpdated: new Date().toISOString()
        };

        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/b/${JSONBIN_CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_CONFIG.API_KEY
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la sauvegarde');
        }

        // Update local cache
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

        return true;
    } catch (error) {
        console.error('Erreur sauvegarde cloud:', error);
        // DO NOT Fallback to local storage to ensure we know if cloud failed
        // saveMembersLocal(members); 
        throw new Error('Impossible de sauvegarder sur le cloud (JSONBin). Vérifiez votre connexion ou la configuration.');
    }
}

// ============================================
// LOCAL STORAGE FUNCTIONS (Fallback)
// ============================================

function getAllMembersLocal() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        return [];
    }
    try {
        const parsed = JSON.parse(data);
        return parsed.members || [];
    } catch (e) {
        console.error('Error parsing members data:', e);
        return [];
    }
}

function saveMembersLocal(members) {
    const data = {
        members: members,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ============================================
// PUBLIC API
// ============================================

// Get all members (tries cloud first, falls back to local)
async function getAllMembers() {
    return await fetchMembersFromCloud();
}

// Add a new member (saves to cloud)
async function addMember(memberData) {
    const members = await fetchMembersFromCloud();
    const newMember = {
        id: generateId(),
        ...memberData,
        dateInscription: new Date().toISOString()
    };
    members.push(newMember);
    await saveMembersToCloud(members);
    return newMember;
}

// Update a member (saves to cloud)
async function updateMember(id, memberData) {
    const members = await fetchMembersFromCloud();
    const index = members.findIndex(m => m.id === id);
    if (index !== -1) {
        members[index] = {
            ...members[index],
            ...memberData
        };
        await saveMembersToCloud(members);
        return members[index];
    }
    return null;
}

// Delete a member (saves to cloud)
async function deleteMember(id) {
    const members = await fetchMembersFromCloud();
    const filtered = members.filter(m => m.id !== id);
    await saveMembersToCloud(filtered);
    return filtered.length < members.length;
}

// Get a single member by ID
async function getMember(id) {
    const members = await fetchMembersFromCloud();
    return members.find(m => m.id === id);
}

// Export members to JSON file (from cloud)
async function exportToJSON() {
    const members = await fetchMembersFromCloud();
    const data = {
        members: members,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import members from JSON file (saves to cloud)
function importFromJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.members && Array.isArray(data.members)) {
                    await saveMembersToCloud(data.members);
                    resolve(data.members);
                } else {
                    reject(new Error('Format de fichier invalide'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
        reader.readAsText(file);
    });
}

// Sync local cache with cloud
async function syncWithCloud() {
    try {
        await fetchMembersFromCloud();
        return true;
    } catch (error) {
        console.error('Erreur de synchronisation:', error);
        return false;
    }
}

// Check if API is configured
function isAPIConfigured() {
    return JSONBIN_CONFIG.API_KEY !== 'VOTRE_CLE_API_ICI' &&
        JSONBIN_CONFIG.BIN_ID !== 'VOTRE_BIN_ID_ICI';
}
