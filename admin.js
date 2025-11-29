// Admin dashboard logic
document.addEventListener('DOMContentLoaded', async () => {
    // Check if API is configured
    if (!isAPIConfigured()) {
        alert('⚠️ IMPORTANT: Configurez votre clé API JSONBin.io dans config.js');
    }

    await loadMembers();
    await updateStats();
});

// Load and display all members
async function loadMembers() {
    const members = await getAllMembers();
    const container = document.getElementById('membersTableContainer');

    if (members.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                </svg>
                <h3>Aucun membre inscrit</h3>
                <p>Les membres qui s'inscriront apparaîtront ici.</p>
            </div>
        `;
        return;
    }

    let tableHTML = `
        <table id="membersTable" class="members-table">
            <thead>
                <tr>
                    <th>N°</th>
                    <th>Photo</th>
                    <th>Nom</th>
                    <th>Prénoms</th>
                    <th>Poste</th>
                    <th>Contact</th>
                    <th>Date Inscription</th>
                    <th>Modifier</th>
                    <th>PDF</th>
                    <th>Supprimer</th>
                </tr>
            </thead>
            <tbody>
    `;

    members.forEach((member, index) => {
        const date = new Date(member.dateInscription).toLocaleDateString('fr-FR');
        const rowNumber = index + 1;
        tableHTML += `
            <tr>
                <td><strong>${rowNumber}</strong></td>
                <td><img src="${member.photo}" alt="${member.prenoms}" class="member-photo"></td>
                <td><strong>${member.nom}</strong></td>
                <td>${member.prenoms}</td>
                <td>${member.poste}</td>
                <td>${member.contact}</td>
                <td>${date}</td>
                <td>
                    <button class="action-btn edit" onclick="editMember('${member.id}')">
                        ✏️ Modifier
                    </button>
                </td>
                <td>
                    <button class="action-btn pdf" onclick="generateSingleBadgePDF('${member.id}')">
                        📄 PDF
                    </button>
                </td>
                <td>
                    <button class="action-btn delete" onclick="deleteMemberConfirm('${member.id}')">
                        🗑️ Supprimer
                    </button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;

    // Initialize DataTable
    if ($.fn.DataTable.isDataTable('#membersTable')) {
        $('#membersTable').DataTable().destroy();
    }

    $('#membersTable').DataTable({
        responsive: false, // Disable responsive to show all columns
        scrollX: true, // Enable horizontal scrolling
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/fr-FR.json'
        },
        order: [[6, 'desc']], // Sort by date inscription (newest first)
        pageLength: 10,
        columnDefs: [
            { orderable: false, targets: [0, 1, 7, 8, 9] }, // Disable sorting for N°, Photo and Action columns
            { width: '50px', targets: 0 }, // N° column width
            { width: '60px', targets: 1 }, // Photo column width
            { width: '100px', targets: 7 }, // Modifier column width
            { width: '80px', targets: 8 }, // PDF column width
            { width: '100px', targets: 9 }  // Supprimer column width
        ]
    });
}

// Update statistics
async function updateStats() {
    const members = await getAllMembers();
    document.getElementById('totalMembers').textContent = members.length;

    const today = new Date().toDateString();
    const todayCount = members.filter(m =>
        new Date(m.dateInscription).toDateString() === today
    ).length;
    document.getElementById('todayMembers').textContent = todayCount;
}

// Edit member
async function editMember(id) {
    const member = await getMember(id);
    if (!member) return;

    document.getElementById('editId').value = member.id;
    document.getElementById('editNom').value = member.nom;
    document.getElementById('editPrenoms').value = member.prenoms;
    document.getElementById('editPoste').value = member.poste;
    document.getElementById('editContact').value = member.contact;
    document.getElementById('editDateBapteme').value = member.dateBapteme;
    document.getElementById('editDateAdhesion').value = member.dateAdhesion;

    document.getElementById('editModal').classList.add('active');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

// Handle edit form submission
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const contactValue = document.getElementById('editContact').value;

    // Generate QR Code data string
    let phoneNumber = contactValue.replace(/\s/g, '') || '';
    if (phoneNumber.startsWith('0')) {
        phoneNumber = '+225' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('+') && phoneNumber.length > 0) {
        phoneNumber = '+225' + phoneNumber;
    }
    const qrCodeData = `tel:${phoneNumber}`;

    const updatedData = {
        nom: document.getElementById('editNom').value,
        prenoms: document.getElementById('editPrenoms').value,
        poste: document.getElementById('editPoste').value,
        contact: contactValue,
        dateBapteme: document.getElementById('editDateBapteme').value,
        dateAdhesion: document.getElementById('editDateAdhesion').value,
        qrcode: qrCodeData
    };

    await updateMember(id, updatedData);
    closeEditModal();
    await loadMembers();
    alert('Membre mis à jour avec succès !');
});

// Delete member with confirmation
async function deleteMemberConfirm(id) {
    const member = await getMember(id);
    if (!member) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${member.prenoms} ${member.nom} ?`)) {
        await deleteMember(id);
        await loadMembers();
        await updateStats();
        alert('Membre supprimé avec succès !');
    }
}

// Export to JSON
function exportJSON() {
    exportToJSON();
}

// Import from JSON
async function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        await importFromJSON(file);
        await loadMembers();
        await updateStats();
        alert('Données importées avec succès !');
    } catch (error) {
        alert('Erreur lors de l\'importation : ' + error.message);
    }
}

// Generate single badge PDF
async function generateSingleBadgePDF(id) {
    const member = await getMember(id);
    if (!member) return;

    try {
        // Update template with member data
        document.getElementById('templatePhoto').src = member.photo;
        document.getElementById('templateNom').textContent = member.nom;
        document.getElementById('templatePrenoms').textContent = member.prenoms;
        document.getElementById('templatePoste').textContent = member.poste;
        document.getElementById('templateContact').textContent = member.contact;
        // Generate QR Code
        const qrContainer = document.getElementById('templateQRCode');
        qrContainer.innerHTML = ''; // Clear previous QR

        let qrText;
        if (member.qrcode) {
            qrText = member.qrcode;
        } else {
            let phoneNumber = member.contact.replace(/\s/g, '');
            if (phoneNumber.startsWith('0')) {
                phoneNumber = '+225' + phoneNumber.substring(1);
            } else if (!phoneNumber.startsWith('+')) {
                phoneNumber = '+225' + phoneNumber;
            }
            qrText = `tel:${phoneNumber}`;
        }

        // Generate QR
        new QRCode(qrContainer, {
            text: qrText,
            width: 70,
            height: 70,
            colorDark: "#1e293b",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });

        // Wait for QR code rendering
        await new Promise(resolve => setTimeout(resolve, 500));

        // FIX: Convert QR Canvas to Image for html2canvas
        const qrCanvas = qrContainer.querySelector('canvas');
        if (qrCanvas) {
            const qrImg = document.createElement('img');
            qrImg.src = qrCanvas.toDataURL('image/png');
            qrImg.style.width = '70px';
            qrImg.style.height = '70px';
            qrImg.style.display = 'block';
            qrContainer.innerHTML = ''; // Remove canvas
            qrContainer.appendChild(qrImg); // Add image

            // Wait for image insertion
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Generate PDF
        const badgeElement = document.getElementById('badge');
        const canvas = await html2canvas(badgeElement, {
            scale: 4,
            useCORS: true,
            allowTaint: true,
            backgroundColor: null
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [54, 85.6]
        });

        doc.addImage(imgData, 'PNG', 0, 0, 54, 85.6);
        doc.save(`badge_${member.nom}_${member.prenoms}.pdf`);

    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Erreur lors de la génération du PDF');
    }
}

// Generate all badges in one PDF (one badge per page)
async function generateAllBadgesPDF() {
    const members = await getAllMembers();

    if (members.length === 0) {
        alert('Aucun membre à exporter');
        return;
    }

    if (!confirm(`Générer un PDF avec ${members.length} badge(s) ?`)) {
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [54, 85.6]
        });

        for (let i = 0; i < members.length; i++) {
            const member = members[i];

            // Update template
            document.getElementById('templatePhoto').src = member.photo;
            document.getElementById('templateNom').textContent = member.nom;
            document.getElementById('templatePrenoms').textContent = member.prenoms;
            document.getElementById('templatePoste').textContent = member.poste;
            document.getElementById('templateContact').textContent = member.contact;
            document.getElementById('templateBapteme').textContent = member.dateBapteme;
            document.getElementById('templateAdhesion').textContent = member.dateAdhesion;

            // Generate QR Code
            const qrContainer = document.getElementById('templateQRCode');
            qrContainer.innerHTML = ''; // Clear previous QR

            let qrText;
            if (member.qrcode) {
                qrText = member.qrcode;
            } else {
                let phoneNumber = member.contact.replace(/\s/g, '');
                if (phoneNumber.startsWith('0')) {
                    phoneNumber = '+225' + phoneNumber.substring(1);
                } else if (!phoneNumber.startsWith('+')) {
                    phoneNumber = '+225' + phoneNumber;
                }
                qrText = `tel:${phoneNumber}`;
            }

            new QRCode(qrContainer, {
                text: qrText,
                width: 70,
                height: 70,
                colorDark: "#1e293b",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });

            // Wait for rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            // FIX: Convert QR Canvas to Image for html2canvas
            const qrCanvas = qrContainer.querySelector('canvas');
            if (qrCanvas) {
                const qrImg = document.createElement('img');
                qrImg.src = qrCanvas.toDataURL('image/png');
                qrImg.style.width = '70px';
                qrImg.style.height = '70px';
                qrImg.style.display = 'block';
                qrContainer.innerHTML = ''; // Remove canvas
                qrContainer.appendChild(qrImg); // Add image

                // Wait for image insertion
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Capture badge
            const badgeElement = document.getElementById('badge');
            const canvas = await html2canvas(badgeElement, {
                scale: 4,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null
            });

            const imgData = canvas.toDataURL('image/png');

            // Add page for each badge (except first)
            if (i > 0) {
                doc.addPage([54, 85.6], 'portrait');
            }

            doc.addImage(imgData, 'PNG', 0, 0, 54, 85.6);
        }

        // Download PDF
        const date = new Date().toISOString().split('T')[0];
        doc.save(`tous_les_badges_${date}.pdf`);

        alert('PDF généré avec succès !');

    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        alert('Erreur lors de la génération du PDF');
    }
}
