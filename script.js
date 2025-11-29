document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const form = document.getElementById('badgeForm');

    // Inputs
    const inputs = {
        nom: document.getElementById('nom'),
        prenoms: document.getElementById('prenoms'),
        poste: document.getElementById('poste'),
        contact: document.getElementById('contact'),
        dateBapteme: document.getElementById('dateBapteme'),
        dateAdhesion: document.getElementById('dateAdhesion'),
        theme: document.getElementById('themeColor'),
        photo: document.getElementById('photoUpload')
    };

    // Preview Elements
    const previews = {
        nom: document.getElementById('previewNom'),
        prenoms: document.getElementById('previewPrenoms'),
        poste: document.getElementById('previewPoste'),
        contact: document.getElementById('previewContact'),
        dateBapteme: document.getElementById('previewBapteme'),
        dateAdhesion: document.getElementById('previewAdhesion'),
        photo: document.getElementById('previewPhoto')
    };

    const badgeHeader = document.querySelector('.badge-header');
    const badgeFooter = document.querySelector('.badge-footer');
    const photoFrame = document.querySelector('.photo-frame');

    // Update Text Fields
    const updatePreview = () => {
        previews.nom.textContent = inputs.nom.value || '';
        previews.prenoms.textContent = inputs.prenoms.value || '';
        previews.poste.textContent = inputs.poste.value || '';
        previews.contact.textContent = inputs.contact.value || '';
        previews.dateBapteme.textContent = inputs.dateBapteme.value || '';
        previews.dateAdhesion.textContent = inputs.dateAdhesion.value || '';

        generateQRCode();
    };

    // Generate QR Code
    const generateQRCode = () => {
        const qrContainer = document.getElementById('previewQRCode');
        if (!qrContainer) return;
        qrContainer.innerHTML = ''; // Clear previous QR

        let phoneNumber = inputs.contact.value.replace(/\s/g, '') || '';
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '+225' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('+') && phoneNumber.length > 0) {
            phoneNumber = '+225' + phoneNumber;
        }

        if (phoneNumber) {
            new QRCode(qrContainer, {
                text: `tel:${phoneNumber}`,
                width: 70,
                height: 70,
                colorDark: "#1e293b",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    };

    // Attach listeners
    Object.keys(inputs).forEach(key => {
        if (key !== 'theme' && key !== 'photo') {
            inputs[key].addEventListener('input', updatePreview);
        }
    });

    // Update Theme Color
    inputs.theme.addEventListener('input', (e) => {
        const color = e.target.value;
        document.documentElement.style.setProperty('--primary-color', color);
        // Direct style updates if needed for PDF consistency
        badgeHeader.style.backgroundColor = color;
        badgeFooter.style.backgroundColor = color;
        photoFrame.style.borderColor = color;
        previews.poste.style.color = color;
    });

    // Handle Photo Upload
    inputs.photo.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previews.photo.src = e.target.result;
            };
            reader.readAsDataURL(file);

            // Update file label
            const fileName = file.name;
            document.querySelector('.file-custom').textContent = fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
        }
    });

    // Print Action
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });

    // Download PDF Action
    document.getElementById('downloadBtn').addEventListener('click', async () => {
        const badgeElement = document.getElementById('badge');
        const btn = document.getElementById('downloadBtn');

        // Visual feedback
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Génération...';
        btn.disabled = true;

        try {
            // Ensure QR code is generated
            generateQRCode();

            // Wait for QR code rendering
            await new Promise(resolve => setTimeout(resolve, 300));

            // Use html2canvas to capture the badge
            const canvas = await html2canvas(badgeElement, {
                scale: 4, // High resolution
                useCORS: true,
                backgroundColor: null
            });

            const imgData = canvas.toDataURL('image/png');

            // Initialize jsPDF
            const { jsPDF } = window.jspdf;
            // Orientation PORTRAIT, unit mm, format CR80 (54 x 85.6)
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [54, 85.6]
            });

            // Add image to PDF (stretch to fit)
            doc.addImage(imgData, 'PNG', 0, 0, 54, 85.6);

            // Save
            doc.save('carte-membre.pdf');

        } catch (err) {
            console.error('Erreur lors de la génération du PDF:', err);
            alert('Une erreur est survenue lors de la création du PDF.');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // Initial generation
    generateQRCode();
});
