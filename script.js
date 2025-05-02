// Common utility functions
const utils = {
    formatDate: (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },
    
    showModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    },
    
    hideModal: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // Add new utility functions
    closeModalOnClickOutside: (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            window.onclick = (event) => {
                if (event.target === modal) {
                    utils.hideModal(modalId);
                }
            };
        }
    },

    validateForm: (formData) => {
        for (let [key, value] of formData.entries()) {
            if (!value) {
                return false;
            }
        }
        return true;
    }
};

// Mock data storage with localStorage integration
const storage = {
    getPatients: () => {
        const patients = localStorage.getItem('patients');
        return patients ? JSON.parse(patients) : [];
    },
    
    savePatients: (patients) => {
        localStorage.setItem('patients', JSON.stringify(patients));
    },
    
    getAppointments: () => {
        const appointments = localStorage.getItem('appointments');
        return appointments ? JSON.parse(appointments) : [];
    },
    
    saveAppointments: (appointments) => {
        localStorage.setItem('appointments', JSON.stringify(appointments));
    },
    
    getPrescriptions: () => {
        const prescriptions = localStorage.getItem('prescriptions');
        return prescriptions ? JSON.parse(prescriptions) : [];
    },
    
    savePrescriptions: (prescriptions) => {
        localStorage.setItem('prescriptions', JSON.stringify(prescriptions));
    }
};

// Dashboard functionality
function initDashboard() {
    const patients = storage.getPatients();
    const appointments = storage.getAppointments();
    const prescriptions = storage.getPrescriptions();
    
    const dashboardCards = document.querySelectorAll('.card .number');
    if (dashboardCards.length) {
        dashboardCards[0].textContent = patients.length;
        dashboardCards[1].textContent = appointments.filter(a => a.date === utils.formatDate(new Date())).length;
        dashboardCards[2].textContent = prescriptions.filter(p => p.status === 'active').length;
        dashboardCards[3].textContent = patients.filter(p => {
            const lastVisit = new Date(p.lastVisit);
            const today = new Date();
            return (today - lastVisit) / (1000 * 60 * 60 * 24) <= 7;
        }).length;
    }

    // Initialize recent activity
    updateRecentActivity();
}

function updateRecentActivity() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;

    const appointments = storage.getAppointments();
    const recentActivities = appointments
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    activityList.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <span class="time">${activity.date} ${activity.time}</span>
            <span class="description">Appointment with ${activity.patientName}</span>
        </div>
    `).join('');
}

// Patient Records functionality
function initPatientRecords() {
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    const addPatientBtn = document.querySelector('.primary-btn');
    
    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', () => {
            utils.showModal('addPatientModal');
        });
    }
    
    if (searchInput && searchButton) {
        searchButton.addEventListener('click', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const patients = storage.getPatients();
            const filteredPatients = patients.filter(patient => 
                patient.name.toLowerCase().includes(searchTerm) ||
                patient.id.toLowerCase().includes(searchTerm)
            );
            updatePatientTable(filteredPatients);
        });
    }

    // Initialize patient table
    updatePatientTable(storage.getPatients());
}

function updatePatientTable(patients) {
    const tbody = document.querySelector('table tbody');
    if (tbody) {
        tbody.innerHTML = patients.map(patient => `
            <tr>
                <td>${patient.id}</td>
                <td>${patient.name}</td>
                <td>${patient.age}</td>
                <td>${patient.gender}</td>
                <td>${patient.contact}</td>
                <td>${patient.lastVisit}</td>
                <td>
                    <button class="action-btn" onclick="viewPatient('${patient.id}')">View</button>
                    <button class="action-btn" onclick="editPatient('${patient.id}')">Edit</button>
                    <button class="action-btn" onclick="deletePatient('${patient.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

function viewPatient(patientId) {
    const patients = storage.getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        // Show patient details in a modal
        const modal = document.getElementById('viewPatientModal');
        if (modal) {
            modal.querySelector('.patient-name').textContent = patient.name;
            modal.querySelector('.patient-id').textContent = patient.id;
            modal.querySelector('.patient-age').textContent = patient.age;
            modal.querySelector('.patient-gender').textContent = patient.gender;
            modal.querySelector('.patient-contact').textContent = patient.contact;
            modal.querySelector('.patient-last-visit').textContent = patient.lastVisit;
            utils.showModal('viewPatientModal');
        }
    }
}

function editPatient(patientId) {
    const patients = storage.getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (patient) {
        const form = document.querySelector('.patient-form');
        if (form) {
            form.querySelector('[name="fullName"]').value = patient.name;
            form.querySelector('[name="gender"]').value = patient.gender;
            form.querySelector('[name="phone"]').value = patient.contact;
            utils.showModal('editPatientModal');
        }
    }
}

function deletePatient(patientId) {
    if (confirm('Are you sure you want to delete this patient?')) {
        const patients = storage.getPatients();
        const updatedPatients = patients.filter(p => p.id !== patientId);
        storage.savePatients(updatedPatients);
        updatePatientTable(updatedPatients);
        utils.showNotification('Patient deleted successfully');
    }
}

// Add Patient functionality
function initAddPatient() {
    const form = document.querySelector('.patient-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            if (!utils.validateForm(formData)) {
                utils.showNotification('Please fill in all fields', 'error');
                return;
            }

            const patients = storage.getPatients();
            const newPatient = {
                id: `P${String(patients.length + 1).padStart(3, '0')}`,
                name: formData.get('fullName'),
                age: calculateAge(formData.get('dob')),
                gender: formData.get('gender'),
                contact: formData.get('phone'),
                lastVisit: utils.formatDate(new Date())
            };
            
            patients.push(newPatient);
            storage.savePatients(patients);
            utils.showNotification('Patient added successfully');
            form.reset();
            utils.hideModal('addPatientModal');
        });
    }
}

function calculateAge(dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Appointments functionality
function initAppointments() {
    const newAppointmentBtn = document.querySelector('.primary-btn');
    if (newAppointmentBtn) {
        newAppointmentBtn.addEventListener('click', () => {
            utils.showModal('appointmentModal');
        });
    }
    
    const appointmentForm = document.querySelector('.appointment-form');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(appointmentForm);
            
            if (!utils.validateForm(formData)) {
                utils.showNotification('Please fill in all fields', 'error');
                return;
            }

            const appointments = storage.getAppointments();
            const newAppointment = {
                id: `A${String(appointments.length + 1).padStart(3, '0')}`,
                patientId: formData.get('patient'),
                patientName: formData.get('patientName'),
                doctor: formData.get('doctor'),
                date: formData.get('appointmentDate'),
                time: formData.get('appointmentTime'),
                type: formData.get('appointmentType'),
                status: 'pending'
            };
            
            appointments.push(newAppointment);
            storage.saveAppointments(appointments);
            utils.showNotification('Appointment scheduled successfully');
            utils.hideModal('appointmentModal');
            appointmentForm.reset();
            updateAppointmentsTable();
        });
    }

    // Initialize appointments table
    updateAppointmentsTable();
}

function updateAppointmentsTable() {
    const tbody = document.querySelector('table tbody');
    if (tbody) {
        const appointments = storage.getAppointments();
        tbody.innerHTML = appointments.map(appointment => `
            <tr>
                <td>${appointment.id}</td>
                <td>${appointment.patientName}</td>
                <td>${appointment.doctor}</td>
                <td>${appointment.date}</td>
                <td>${appointment.time}</td>
                <td>${appointment.type}</td>
                <td><span class="status ${appointment.status}">${appointment.status}</span></td>
                <td>
                    <button class="action-btn" onclick="cancelAppointment('${appointment.id}')">Cancel</button>
                </td>
            </tr>
        `).join('');
    }
}

function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        const appointments = storage.getAppointments();
        const updatedAppointments = appointments.map(appointment => {
            if (appointment.id === appointmentId) {
                return { ...appointment, status: 'cancelled' };
            }
            return appointment;
        });
        storage.saveAppointments(updatedAppointments);
        updateAppointmentsTable();
        utils.showNotification('Appointment cancelled successfully');
    }
}

// Prescriptions functionality
function initPrescriptions() {
    const newPrescriptionBtn = document.querySelector('.primary-btn');
    if (newPrescriptionBtn) {
        newPrescriptionBtn.addEventListener('click', () => {
            utils.showModal('prescriptionModal');
        });
    }
    
    const prescriptionForm = document.querySelector('.prescription-form');
    if (prescriptionForm) {
        prescriptionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(prescriptionForm);
            
            if (!utils.validateForm(formData)) {
                utils.showNotification('Please fill in all fields', 'error');
                return;
            }

            const prescriptions = storage.getPrescriptions();
            const newPrescription = {
                id: `R${String(prescriptions.length + 1).padStart(3, '0')}`,
                patientId: formData.get('patient'),
                patientName: formData.get('patientName'),
                medication: formData.get('medication'),
                dosage: formData.get('dosage'),
                frequency: formData.get('frequency'),
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                status: 'active'
            };
            
            prescriptions.push(newPrescription);
            storage.savePrescriptions(prescriptions);
            utils.showNotification('Prescription added successfully');
            utils.hideModal('prescriptionModal');
            prescriptionForm.reset();
            updatePrescriptionsTable();
        });
    }

    // Initialize prescriptions table
    updatePrescriptionsTable();
}

function updatePrescriptionsTable() {
    const tbody = document.querySelector('table tbody');
    if (tbody) {
        const prescriptions = storage.getPrescriptions();
        tbody.innerHTML = prescriptions.map(prescription => `
            <tr>
                <td>${prescription.id}</td>
                <td>${prescription.patientName}</td>
                <td>${prescription.medication}</td>
                <td>${prescription.dosage}</td>
                <td>${prescription.frequency}</td>
                <td>${prescription.startDate}</td>
                <td>${prescription.endDate}</td>
                <td><span class="status ${prescription.status}">${prescription.status}</span></td>
                <td>
                    <button class="action-btn" onclick="printPrescription('${prescription.id}')">Print</button>
                    <button class="action-btn" onclick="endPrescription('${prescription.id}')">End</button>
                </td>
            </tr>
        `).join('');
    }
}

function printPrescription(prescriptionId) {
    const prescriptions = storage.getPrescriptions();
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (prescription) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Prescription - ${prescription.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .prescription-details { margin-bottom: 20px; }
                        .footer { margin-top: 50px; text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Medical Prescription</h1>
                    </div>
                    <div class="prescription-details">
                        <p><strong>Patient:</strong> ${prescription.patientName}</p>
                        <p><strong>Medication:</strong> ${prescription.medication}</p>
                        <p><strong>Dosage:</strong> ${prescription.dosage}</p>
                        <p><strong>Frequency:</strong> ${prescription.frequency}</p>
                        <p><strong>Start Date:</strong> ${prescription.startDate}</p>
                        <p><strong>End Date:</strong> ${prescription.endDate}</p>
                    </div>
                    <div class="footer">
                        <p>Doctor's Signature: _________________</p>
                        <p>Date: ${utils.formatDate(new Date())}</p>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

function endPrescription(prescriptionId) {
    if (confirm('Are you sure you want to end this prescription?')) {
        const prescriptions = storage.getPrescriptions();
        const updatedPrescriptions = prescriptions.map(prescription => {
            if (prescription.id === prescriptionId) {
                return { ...prescription, status: 'ended' };
            }
            return prescription;
        });
        storage.savePrescriptions(updatedPrescriptions);
        updatePrescriptionsTable();
        utils.showNotification('Prescription ended successfully');
    }
}

// Initialize based on current page
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
        case 'index.html':
        case '':
            initDashboard();
            break;
        case 'patient-records.html':
            initPatientRecords();
            break;
        case 'add-patient.html':
            initAddPatient();
            break;
        case 'appointments.html':
            initAppointments();
            break;
        case 'prescriptions.html':
            initPrescriptions();
            break;
    }

    // Add click outside handlers for all modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        utils.closeModalOnClickOutside(modal.id);
    });
}); 