/**
 * Main Application UI Logic
 */

const app = {
    currentView: 'dashboard',

    init() {
        this.bindEvents();
        this.checkLoginStatus();
    },

    bindEvents() {
        // Login Form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('login-username').value;
            const pass = document.getElementById('login-password').value;

            if (user === 'admin' && pass === 'admin123') {
                localStorage.setItem('isLoggedIn', 'true');
                this.checkLoginStatus();
            } else {
                alert('Username atau password salah! (Hint: admin / admin123)');
            }
        });

        // Logout
        document.getElementById('btn-logout').addEventListener('click', () => {
            localStorage.removeItem('isLoggedIn');
            this.checkLoginStatus();
        });

        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                this.navigate(view);
            });
        });

        // Forms
        document.getElementById('form-karyawan').addEventListener('submit', this.handleFormKaryawan.bind(this));
        document.getElementById('form-kriteria').addEventListener('submit', this.handleFormKriteria.bind(this));
        document.getElementById('form-subkriteria').addEventListener('submit', this.handleFormSubkriteria.bind(this));
        document.getElementById('form-penilaian').addEventListener('submit', this.handleFormPenilaian.bind(this));
    },

    checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn === 'true') {
            document.getElementById('login-view').classList.add('hidden');
            document.getElementById('app-view').classList.remove('hidden');
            this.navigate('dashboard');
        } else {
            document.getElementById('login-view').classList.remove('hidden');
            document.getElementById('app-view').classList.add('hidden');
        }
    },

    navigate(view) {
        this.currentView = view;

        // Update Sidebar
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.view === view) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Update Views
        document.querySelectorAll('.view-section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(`view-${view}`).classList.remove('hidden');

        // Update Breadcrumb
        const breadcrumbTitle = view.charAt(0).toUpperCase() + view.slice(1);
        document.getElementById('header-breadcrumb').innerHTML = `Admin <i class="fa-solid fa-chevron-right text-xs" style="margin: 0 0.5rem; color: var(--border-color);"></i> <span class="active">${breadcrumbTitle.replace('Saw', 'SAW')}</span>`;

        // Render Data based on view
        switch (view) {
            case 'dashboard': this.renderDashboard(); break;
            case 'karyawan': this.renderKaryawan(); break;
            case 'kriteria': this.renderKriteria(); break;
            case 'subkriteria':
                this.populateFilterSubkriteria();
                this.renderSubkriteria();
                break;
            case 'penilaian': this.renderPenilaian(); break;
            case 'perhitungan':
                if (!Store.getData('CALCULATION_HISTORY') || Store.getData('CALCULATION_HISTORY').length === 0) {
                    this.calculateSAW(); // auto calculate if empty
                } else {
                    this.renderPerhitungan();
                }
                break;
            case 'laporan': this.renderLaporan(); break;
        }
    },

    showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    },

    hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },

    // --- DASHBOARD ---
    renderDashboard() {
        const karyawan = Store.getKaryawan();
        const kriteria = Store.getKriteria();
        const penilaian = Store.getPenilaian();
        const calcResult = SAW.getLatestResult();

        document.getElementById('dash-total-karyawan').textContent = karyawan.length;
        document.getElementById('dash-total-kriteria').textContent = kriteria.length;

        let completed = 0;
        karyawan.forEach(k => {
            const p = penilaian.find(pen => pen.karyawan_id === k.id);
            if (p && Object.keys(p.nilai).length === kriteria.length) completed++;
        });
        document.getElementById('dash-total-penilaian').textContent = completed;

        const tbody = document.getElementById('dash-top-5-list');
        tbody.innerHTML = '';

        if (calcResult && !calcResult.error && calcResult.hasilV.length > 0) {
            const best = calcResult.hasilV[0];
            document.getElementById('dash-mvp-name').textContent = best.karyawan_kode;
            document.getElementById('dash-mvp-score').textContent = best.skor.toFixed(2);

            const top5 = calcResult.hasilV.slice(0, 5);
            const maxScore = top5[0].skor || 1; // avoid division by zero

            top5.forEach(item => {
                const percentage = (item.skor / maxScore) * 100;
                let colorClass = 'bg-gray-400';
                if (item.rank === 1) colorClass = 'var(--primary-color)';
                else if (item.rank === 2) colorClass = '#5D4037';
                else if (item.rank === 3) colorClass = '#795548';
                else if (item.rank === 4) colorClass = '#D7CCC8';
                else colorClass = '#EFEBE9';

                const html = `
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <div class="flex justify-between text-sm">
                            <span class="font-bold">${item.karyawan_kode} - ${item.karyawan_nama}</span>
                            <span class="font-bold">${item.skor.toFixed(2)}</span>
                        </div>
                        <div class="progress-bar-wrap">
                            <div class="progress-bar" style="width: ${percentage}%; background-color: ${colorClass};"></div>
                        </div>
                    </div>
                `;
                tbody.innerHTML += html;
            });
        } else {
            document.getElementById('dash-mvp-name').textContent = '-';
            document.getElementById('dash-mvp-score').textContent = '';
            tbody.innerHTML = '<div class="text-sm text-muted">Belum ada data perhitungan.</div>';
        }
    },

    // --- KARYAWAN ---
    renderKaryawan() {
        const data = Store.getKaryawan();
        const tbody = document.getElementById('tbody-karyawan');
        tbody.innerHTML = '';
        data.forEach((item, index) => {
            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td class="font-bold">${item.kode}</td>
                    <td>${item.nama}</td>
                    <td>${item.posisi}</td>
                    <td class="text-center">
                        <button class="btn btn-outline btn-sm mr-2" onclick="app.editKaryawan('${item.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteKaryawan('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    },

    handleFormKaryawan(e) {
        e.preventDefault();
        const id = document.getElementById('form-karyawan-id').value;
        const data = {
            kode: document.getElementById('form-karyawan-kode').value,
            nama: document.getElementById('form-karyawan-nama').value,
            posisi: document.getElementById('form-karyawan-posisi').value
        };

        if (id) {
            Store.updateKaryawan(id, data);
        } else {
            Store.addKaryawan(data);
        }

        this.hideModal('modal-karyawan');
        document.getElementById('form-karyawan').reset();
        document.getElementById('form-karyawan-id').value = '';
        this.renderKaryawan();
    },

    editKaryawan(id) {
        const data = Store.getKaryawan().find(item => item.id === id);
        if (data) {
            document.getElementById('form-karyawan-id').value = data.id;
            document.getElementById('form-karyawan-kode').value = data.kode;
            document.getElementById('form-karyawan-nama').value = data.nama;
            document.getElementById('form-karyawan-posisi').value = data.posisi;
            document.getElementById('modal-karyawan-title').textContent = 'Edit Karyawan';
            this.showModal('modal-karyawan');
        }
    },

    deleteKaryawan(id) {
        if (confirm('Yakin ingin menghapus karyawan ini? Data penilaian juga akan terhapus.')) {
            Store.deleteKaryawan(id);
            this.renderKaryawan();
        }
    },

    // --- KRITERIA ---
    renderKriteria() {
        const data = Store.getKriteria();
        const tbody = document.getElementById('tbody-kriteria');
        tbody.innerHTML = '';
        let totalBobot = 0;
        data.forEach(item => {
            totalBobot += parseFloat(item.bobot);
            tbody.innerHTML += `
                <tr>
                    <td class="font-bold">${item.kode}</td>
                    <td>${item.nama}</td>
                    <td>Benefit</td>
                    <td>${parseFloat(item.bobot).toFixed(2)}</td>
                    <td class="text-center">
                        <button class="btn btn-outline btn-sm mr-2" onclick="app.editKriteria('${item.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn btn-danger btn-sm" onclick="app.deleteKriteria('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        document.getElementById('total-bobot-display').textContent = totalBobot.toFixed(2);
        if (Math.abs(totalBobot - 1.0) > 0.01) {
            document.getElementById('total-bobot-display').style.color = 'var(--danger-color)';
        } else {
            document.getElementById('total-bobot-display').style.color = 'var(--success-color)';
        }
    },

    handleFormKriteria(e) {
        e.preventDefault();
        const id = document.getElementById('form-kriteria-id').value;
        const data = {
            kode: document.getElementById('form-kriteria-kode').value,
            nama: document.getElementById('form-kriteria-nama').value,
            bobot: parseFloat(document.getElementById('form-kriteria-bobot').value)
        };

        if (id) {
            Store.updateKriteria(id, data);
        } else {
            Store.addKriteria(data);
        }

        this.hideModal('modal-kriteria');
        document.getElementById('form-kriteria').reset();
        document.getElementById('form-kriteria-id').value = '';
        this.renderKriteria();
    },

    editKriteria(id) {
        const data = Store.getKriteria().find(item => item.id === id);
        if (data) {
            document.getElementById('form-kriteria-id').value = data.id;
            document.getElementById('form-kriteria-kode').value = data.kode;
            document.getElementById('form-kriteria-nama').value = data.nama;
            document.getElementById('form-kriteria-bobot').value = data.bobot;
            document.getElementById('modal-kriteria-title').textContent = 'Edit Kriteria';
            this.showModal('modal-kriteria');
        }
    },

    deleteKriteria(id) {
        if (confirm('Yakin ingin menghapus kriteria ini?')) {
            Store.deleteKriteria(id);
            this.renderKriteria();
        }
    },

    // --- SUBKRITERIA ---
    populateFilterSubkriteria() {
        const kriteria = Store.getKriteria();
        const select = document.getElementById('filter-subkriteria');
        const selectForm = document.getElementById('form-subkriteria-kriteria');

        let options = '<option value="ALL">Tampilkan Semua Kriteria</option>';
        let formOptions = '';
        kriteria.forEach(k => {
            options += `<option value="${k.id}">${k.kode} - ${k.nama}</option>`;
            formOptions += `<option value="${k.id}">${k.kode} - ${k.nama}</option>`;
        });

        select.innerHTML = options;
        selectForm.innerHTML = formOptions;
    },

    renderSubkriteria() {
        const filter = document.getElementById('filter-subkriteria').value;
        const data = Store.getSubkriteria();
        const kriteria = Store.getKriteria();
        const tbody = document.getElementById('tbody-subkriteria');
        tbody.innerHTML = '';

        data.forEach(item => {
            if (filter !== 'ALL' && item.kriteria_id !== filter) return;

            const kName = kriteria.find(k => k.id === item.kriteria_id)?.nama || 'Unknown';
            tbody.innerHTML += `
                <tr>
                    <td class="font-bold">${item.kriteria_id} - ${kName}</td>
                    <td>${item.deskripsi}</td>
                    <td><span class="badge ${item.nilai >= 4 ? 'badge-success' : (item.nilai == 3 ? 'badge-warning' : 'badge-danger')}">${item.nilai}</span></td>
                    <td class="text-center">
                        <button class="btn btn-danger btn-sm" onclick="app.deleteSubkriteria('${item.id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    },

    handleFormSubkriteria(e) {
        e.preventDefault();
        const data = {
            kriteria_id: document.getElementById('form-subkriteria-kriteria').value,
            deskripsi: document.getElementById('form-subkriteria-deskripsi').value,
            nilai: parseInt(document.getElementById('form-subkriteria-nilai').value)
        };

        Store.addSubkriteria(data);

        this.hideModal('modal-subkriteria');
        document.getElementById('form-subkriteria').reset();
        this.renderSubkriteria();
    },

    deleteSubkriteria(id) {
        if (confirm('Hapus subkriteria?')) {
            Store.deleteSubkriteria(id);
            this.renderSubkriteria();
        }
    },

    // --- PENILAIAN ---
    renderPenilaian() {
        const search = document.getElementById('search-penilaian').value.toLowerCase();
        const karyawan = Store.getKaryawan();
        const kriteria = Store.getKriteria();
        const penilaian = Store.getPenilaian();
        const tbody = document.getElementById('tbody-penilaian');

        let completed = 0;

        tbody.innerHTML = '';
        karyawan.forEach(k => {
            if (search && !k.nama.toLowerCase().includes(search) && !k.kode.toLowerCase().includes(search)) return;

            const p = penilaian.find(pen => pen.karyawan_id === k.id);
            const isCompleted = p && Object.keys(p.nilai).length === kriteria.length;
            if (isCompleted) completed++;

            const statusBadge = isCompleted
                ? '<span class="badge badge-success">DINILAI</span>'
                : '<span class="badge badge-danger">BELUM DINILAI</span>';

            const actionBtn = isCompleted
                ? `<button class="btn btn-outline btn-sm" onclick="app.openPenilaianModal('${k.id}')"><i class="fa-solid fa-pen-to-square"></i> Edit Nilai</button>`
                : `<button class="btn btn-primary btn-sm" onclick="app.openPenilaianModal('${k.id}')"><i class="fa-solid fa-star"></i> Beri Nilai</button>`;

            tbody.innerHTML += `
                <tr>
                    <td>
                        <div class="flex items-center gap-2">
                            <div style="width: 32px; height: 32px; background: #F5F5F5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.8rem; color: var(--primary-color);">
                                ${k.kode}
                            </div>
                            <div>
                                <div class="font-bold">${k.nama}</div>
                                <div class="text-xs text-muted">ID: ${k.id.substring(0, 8)}</div>
                            </div>
                        </div>
                    </td>
                    <td>${k.posisi}</td>
                    <td>${statusBadge}</td>
                    <td class="text-center">${actionBtn}</td>
                </tr>
            `;
        });

        document.getElementById('penilaian-total').textContent = karyawan.length;
        document.getElementById('penilaian-done').textContent = completed;
        document.getElementById('penilaian-pending').textContent = karyawan.length - completed;
    },

    openPenilaianModal(karyawan_id) {
        const k = Store.getKaryawan().find(item => item.id === karyawan_id);
        const kriteria = Store.getKriteria();
        const subkriteria = Store.getSubkriteria();
        const existingPenilaian = Store.getPenilaianByKaryawan(karyawan_id);

        document.getElementById('modal-penilaian-nama').textContent = `${k.kode} - ${k.nama}`;
        document.getElementById('form-penilaian-karyawan-id').value = karyawan_id;

        const container = document.getElementById('penilaian-inputs-container');
        container.innerHTML = '';

        kriteria.forEach(kr => {
            const sub = subkriteria.filter(s => s.kriteria_id === kr.id);
            // Default select fallback to direct input if no subcriteria
            let inputHtml = '';

            let val = existingPenilaian && existingPenilaian.nilai[kr.id] ? existingPenilaian.nilai[kr.id] : '';

            if (sub.length > 0) {
                let options = `<option value="">-- Pilih Nilai --</option>`;
                sub.forEach(s => {
                    const selected = s.nilai == val ? 'selected' : '';
                    options += `<option value="${s.nilai}" ${selected}>${s.deskripsi} (Nilai: ${s.nilai})</option>`;
                });
                inputHtml = `<select class="form-control" name="penilaian_${kr.id}" required>${options}</select>`;
            } else {
                inputHtml = `<input type="number" min="1" max="100" class="form-control" name="penilaian_${kr.id}" value="${val}" placeholder="Masukkan Nilai (Manual)" required>`;
            }

            container.innerHTML += `
                <div class="form-group">
                    <label class="form-label">${kr.kode} - ${kr.nama}</label>
                    ${inputHtml}
                </div>
            `;
        });

        this.showModal('modal-penilaian');
    },

    handleFormPenilaian(e) {
        e.preventDefault();
        const form = document.getElementById('form-penilaian');
        const karyawan_id = document.getElementById('form-penilaian-karyawan-id').value;
        const kriteria = Store.getKriteria();

        let nilaiData = {};
        kriteria.forEach(kr => {
            const input = form.querySelector(`[name="penilaian_${kr.id}"]`);
            if (input) {
                nilaiData[kr.id] = parseFloat(input.value);
            }
        });

        Store.savePenilaian(karyawan_id, nilaiData);
        this.hideModal('modal-penilaian');
        this.renderPenilaian();
    },

    // --- PERHITUNGAN SAW ---
    calculateSAW() {
        const result = SAW.calculate();
        if (result.error) {
            alert(result.error);
        } else {
            alert('Perhitungan SAW berhasil diupdate.');
            this.renderPerhitungan();
        }
    },

    renderPerhitungan() {
        const res = SAW.getLatestResult();
        if (!res || res.error) return;

        const { kriteria, matriksX, matriksR, hasilV } = res;

        // Render Theads
        let theadHtml = `<th>ALT</th><th>Nama</th>`;
        kriteria.forEach(k => {
            theadHtml += `<th title="${k.nama}">${k.kode}</th>`;
        });
        document.getElementById('thead-matriks').innerHTML = theadHtml;
        document.getElementById('thead-normalisasi').innerHTML = theadHtml;

        // Render Matriks X
        let tbodyX = '';
        matriksX.forEach(row => {
            tbodyX += `<tr><td class="font-bold">${row.karyawan_kode}</td><td>${row.karyawan_nama}</td>`;
            kriteria.forEach(k => {
                tbodyX += `<td>${row.nilai[k.id]}</td>`;
            });
            tbodyX += `</tr>`;
        });
        document.getElementById('tbody-matriks').innerHTML = tbodyX;

        // Render Matriks R
        let tbodyR = '';
        matriksR.forEach(row => {
            tbodyR += `<tr><td class="font-bold">${row.karyawan_kode}</td><td>${row.karyawan_nama}</td>`;
            kriteria.forEach(k => {
                tbodyR += `<td>${row.nilai[k.id].toFixed(2)}</td>`;
            });
            tbodyR += `</tr>`;
        });
        document.getElementById('tbody-normalisasi').innerHTML = tbodyR;

        // Render Hasil V
        let tbodyV = '';
        hasilV.forEach(row => {
            tbodyV += `
                <tr>
                    <td><span class="badge ${row.rank <= 3 ? 'badge-success' : 'badge-warning'}">#${row.rank}</span></td>
                    <td class="font-bold">${row.karyawan_kode}</td>
                    <td>${row.karyawan_nama}</td>
                    <td class="font-bold">${row.skor.toFixed(3)}</td>
                </tr>
            `;
        });
        document.getElementById('tbody-hasil').innerHTML = tbodyV;
    },

    switchTab(tabId) {
        document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
        document.querySelector(`.tab-item[data-tab="${tabId}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    },

    switchLapTab(tabId) {
        document.querySelectorAll('.tab-item[data-laptab]').forEach(el => el.classList.remove('active'));
        document.querySelector(`.tab-item[data-laptab="${tabId}"]`).classList.add('active');

        document.querySelectorAll('.laptab-content').forEach(el => el.classList.add('hidden'));
        document.getElementById(`laptab-${tabId}`).classList.remove('hidden');
    },

    // --- LAPORAN ---
    renderLaporan() {
        const res = SAW.getLatestResult();
        
        const date = new Date();
        const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        document.querySelectorAll('.cetak-tanggal').forEach(el => el.textContent = dateStr);
        document.querySelectorAll('.periode-penilaian').forEach(el => el.textContent = `1 Januari - ${dateStr}`);

        if (!res || res.error || res.hasilV.length === 0) {
            document.getElementById('tbody-lap-ranking').innerHTML = '<tr><td colspan="5" class="text-center">Data perhitungan tidak ditemukan. Harap lakukan perhitungan terlebih dahulu.</td></tr>';
            document.getElementById('tbody-lap-rekomendasi').innerHTML = '<tr><td colspan="5" class="text-center">Data perhitungan tidak ditemukan. Harap lakukan perhitungan terlebih dahulu.</td></tr>';
            return;
        }

        // 1. Laporan Hasil Perankingan
        let tbodyRanking = '';
        res.hasilV.forEach((row, index) => {
            tbodyRanking += `
                <tr>
                    <td style="padding: 1rem; border: 1px solid var(--border-color);">${index + 1}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color); font-weight: bold;">${row.karyawan_kode}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color);">${row.karyawan_nama}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color);">${row.skor.toFixed(3)}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color);"><span class="badge" style="background: var(--primary-color); color: white;">Ranking ${row.rank}</span></td>
                </tr>
            `;
        });
        document.getElementById('tbody-lap-ranking').innerHTML = tbodyRanking;

        // 2. Laporan Rekomendasi Tindakan
        let tbodyRekomendasi = '';
        res.hasilV.forEach((row) => {
            let tindakan = "";
            let color = "";
            if (row.skor >= 0.800) {
                tindakan = "Pertahankan Performa";
                color = "var(--success-color)";
            } else if (row.skor >= 0.450) {
                tindakan = "Tingkatkan Performa";
                color = "var(--warning-color)";
            } else {
                tindakan = "Perlu Evaluasi Ulang";
                color = "var(--danger-color)";
            }

            tbodyRekomendasi += `
                <tr>
                    <td style="padding: 1rem; border: 1px solid var(--border-color); font-weight: bold;">#${row.rank}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color);">${row.karyawan_nama}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color);">${row.posisi}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color); font-weight: bold;">${row.skor.toFixed(3)}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color); color: ${color}; font-weight: bold;">${tindakan}</td>
                </tr>
            `;
        });
        document.getElementById('tbody-lap-rekomendasi').innerHTML = tbodyRekomendasi;

        // 3. Laporan Detail Penilaian
        let theadX = `<th style="padding: 1rem; border: 1px solid var(--border-color);">NO</th><th style="padding: 1rem; border: 1px solid var(--border-color);">ALTERNATIF</th><th style="padding: 1rem; border: 1px solid var(--border-color);">NAMA KARYAWAN</th>`;
        res.kriteria.forEach(k => {
            theadX += `<th style="padding: 1rem; border: 1px solid var(--border-color);">${k.kode}</th>`;
        });
        document.getElementById('thead-lap-detail-x').innerHTML = theadX;
        document.getElementById('thead-lap-detail-r').innerHTML = theadX; // Same headers

        let tbodyX = '';
        res.matriksX.forEach((row, index) => {
            tbodyX += `<tr>
                <td style="padding: 1rem; border: 1px solid var(--border-color);">${index + 1}</td>
                <td style="padding: 1rem; border: 1px solid var(--border-color); font-weight: bold;">${row.karyawan_kode}</td>
                <td style="padding: 1rem; border: 1px solid var(--border-color);">${row.karyawan_nama}</td>`;
            res.kriteria.forEach(k => {
                tbodyX += `<td style="padding: 1rem; border: 1px solid var(--border-color);">${row.nilai[k.id]}</td>`;
            });
            tbodyX += `</tr>`;
        });
        document.getElementById('tbody-lap-detail-x').innerHTML = tbodyX;

        let tbodyR = '';
        res.matriksR.forEach((row, index) => {
            tbodyR += `<tr>
                <td style="padding: 1rem; border: 1px solid var(--border-color);">${index + 1}</td>
                <td style="padding: 1rem; border: 1px solid var(--border-color); font-weight: bold;">${row.karyawan_kode}</td>
                <td style="padding: 1rem; border: 1px solid var(--border-color);">${row.karyawan_nama}</td>`;
            res.kriteria.forEach(k => {
                tbodyR += `<td style="padding: 1rem; border: 1px solid var(--border-color);">${row.nilai[k.id].toFixed(2)}</td>`;
            });
            tbodyR += `</tr>`;
        });
        document.getElementById('tbody-lap-detail-r').innerHTML = tbodyR;

        let tbodyV = '';
        res.hasilV.forEach((row) => {
            tbodyV += `<tr>
                <td style="padding: 1rem; border: 1px solid var(--border-color); font-weight: bold;">${row.karyawan_kode}</td>
                <td style="padding: 1rem; border: 1px solid var(--border-color);">${row.karyawan_nama}</td>
                <td style="padding: 1rem; border: 1px solid var(--border-color); font-weight: bold;">${row.skor.toFixed(3)}</td>
            </tr>`;
        });
        document.getElementById('tbody-lap-detail-v').innerHTML = tbodyV;

        // 4. Laporan Kriteria dan Bobot
        let tbodyKriteria = '';
        res.kriteria.forEach((k, index) => {
            tbodyKriteria += `
                <tr>
                    <td style="padding: 1rem; border: 1px solid var(--border-color);">${index + 1}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color); font-weight: bold;">${k.kode}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color);">${k.nama}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color);">${k.bobot}</td>
                    <td style="padding: 1rem; border: 1px solid var(--border-color);"><span class="badge" style="background: var(--primary-light); color: var(--primary-color);">BENEFIT</span></td>
                </tr>
            `;
        });
        document.getElementById('tbody-lap-kriteria').innerHTML = tbodyKriteria;
    }
};

// Start app
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
