/**
 * LocalStorage wrapper for the SAW Employee Selection App
 */

const Store = {
    keys: {
        KARYAWAN: 'saw_karyawan',
        KRITERIA: 'saw_kriteria',
        SUBKRITERIA: 'saw_subkriteria',
        PENILAIAN: 'saw_penilaian',
        CALCULATION_HISTORY: 'saw_history'
    },

    // Default criteria as requested
    defaultKriteria: [
        { id: 'C1', kode: 'C1', nama: 'Kedisiplinan', bobot: 0.15 },
        { id: 'C2', kode: 'C2', nama: 'Kehadiran', bobot: 0.10 },
        { id: 'C3', kode: 'C3', nama: 'Tanggung Jawab', bobot: 0.10 },
        { id: 'C4', kode: 'C4', nama: 'Kerja Sama Tim', bobot: 0.10 },
        { id: 'C5', kode: 'C5', nama: 'Kualitas Kerja', bobot: 0.15 },
        { id: 'C6', kode: 'C6', nama: 'Kecepatan Pelayanan', bobot: 0.10 },
        { id: 'C7', kode: 'C7', nama: 'Komunikasi', bobot: 0.10 },
        { id: 'C8', kode: 'C8', nama: 'Loyalitas', bobot: 0.05 },
        { id: 'C9', kode: 'C9', nama: 'Inisiatif Kerja', bobot: 0.10 },
        { id: 'C10', kode: 'C10', nama: 'Kebersihan dan Kerapihan', bobot: 0.05 }
    ],

    // Default Subkriteria to make testing easier based on user prompt
    defaultSubkriteria: [
        // C1
        { id: 'SC1_1', kriteria_id: 'C1', deskripsi: 'Sangat Buruk', nilai: 1 },
        { id: 'SC1_2', kriteria_id: 'C1', deskripsi: 'Buruk', nilai: 2 },
        { id: 'SC1_3', kriteria_id: 'C1', deskripsi: 'Cukup', nilai: 3 },
        { id: 'SC1_4', kriteria_id: 'C1', deskripsi: 'Bagus', nilai: 4 },
        { id: 'SC1_5', kriteria_id: 'C1', deskripsi: 'Sangat Bagus', nilai: 5 },
        // C2
        { id: 'SC2_1', kriteria_id: 'C2', deskripsi: '1-6 Hari', nilai: 1 },
        { id: 'SC2_2', kriteria_id: 'C2', deskripsi: '7-12 Hari', nilai: 2 },
        { id: 'SC2_3', kriteria_id: 'C2', deskripsi: '13-18 Hari', nilai: 3 },
        { id: 'SC2_4', kriteria_id: 'C2', deskripsi: '19-24 Hari', nilai: 4 },
        { id: 'SC2_5', kriteria_id: 'C2', deskripsi: '25-30 Hari', nilai: 5 },
        // Dummy for others so we don't start totally empty
        { id: 'SC3_1', kriteria_id: 'C3', deskripsi: 'Sangat Bertanggung Jawab', nilai: 5 },
        { id: 'SC3_2', kriteria_id: 'C3', deskripsi: 'Kurang Bertanggung Jawab', nilai: 2 },
        { id: 'SC4_1', kriteria_id: 'C4', deskripsi: 'Sangat Kompak', nilai: 5 },
        { id: 'SC5_1', kriteria_id: 'C5', deskripsi: 'Sangat Berkualitas', nilai: 5 },
        { id: 'SC6_1', kriteria_id: 'C6', deskripsi: 'Sangat Cepat', nilai: 5 },
        { id: 'SC7_1', kriteria_id: 'C7', deskripsi: 'Sangat Baik', nilai: 5 },
        { id: 'SC8_1', kriteria_id: 'C8', deskripsi: 'Sangat Loyal', nilai: 5 },
        { id: 'SC9_1', kriteria_id: 'C9', deskripsi: 'Tinggi', nilai: 5 },
        { id: 'SC10_1', kriteria_id: 'C10', deskripsi: 'Sangat Rapi', nilai: 5 },
    ],

    init() {
        if (!localStorage.getItem(this.keys.KRITERIA)) {
            localStorage.setItem(this.keys.KRITERIA, JSON.stringify(this.defaultKriteria));
        }
        if (!localStorage.getItem(this.keys.SUBKRITERIA)) {
            localStorage.setItem(this.keys.SUBKRITERIA, JSON.stringify(this.defaultSubkriteria));
        }
        if (!localStorage.getItem(this.keys.KARYAWAN)) {
            localStorage.setItem(this.keys.KARYAWAN, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.keys.PENILAIAN)) {
            localStorage.setItem(this.keys.PENILAIAN, JSON.stringify([]));
        }
    },

    // Generic Methods
    getData(key) {
        return JSON.parse(localStorage.getItem(this.keys[key])) || [];
    },

    setData(key, data) {
        localStorage.setItem(this.keys[key], JSON.stringify(data));
    },

    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    },

    // Karyawan CRUD
    getKaryawan() { return this.getData('KARYAWAN'); },
    addKaryawan(data) {
        const items = this.getKaryawan();
        data.id = this.generateId();
        items.push(data);
        this.setData('KARYAWAN', items);
    },
    updateKaryawan(id, data) {
        let items = this.getKaryawan();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...data };
            this.setData('KARYAWAN', items);
        }
    },
    deleteKaryawan(id) {
        let items = this.getKaryawan();
        items = items.filter(item => item.id !== id);
        this.setData('KARYAWAN', items);
        // Also delete their penilaian
        let penilaian = this.getPenilaian();
        penilaian = penilaian.filter(p => p.karyawan_id !== id);
        this.setData('PENILAIAN', penilaian);
    },

    // Kriteria CRUD
    getKriteria() { return this.getData('KRITERIA'); },
    addKriteria(data) {
        const items = this.getKriteria();
        data.id = data.kode; // Using kode as ID for simplicity
        items.push(data);
        this.setData('KRITERIA', items);
    },
    updateKriteria(id, data) {
        let items = this.getKriteria();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...data };
            this.setData('KRITERIA', items);
        }
    },
    deleteKriteria(id) {
        let items = this.getKriteria();
        items = items.filter(item => item.id !== id);
        this.setData('KRITERIA', items);
        
        // delete related subkriteria
        let sub = this.getSubkriteria();
        sub = sub.filter(s => s.kriteria_id !== id);
        this.setData('SUBKRITERIA', sub);
    },

    // Subkriteria CRUD
    getSubkriteria() { return this.getData('SUBKRITERIA'); },
    addSubkriteria(data) {
        const items = this.getSubkriteria();
        data.id = this.generateId();
        items.push(data);
        this.setData('SUBKRITERIA', items);
    },
    deleteSubkriteria(id) {
        let items = this.getSubkriteria();
        items = items.filter(item => item.id !== id);
        this.setData('SUBKRITERIA', items);
    },

    // Penilaian CRUD
    getPenilaian() { return this.getData('PENILAIAN'); },
    savePenilaian(karyawan_id, nilaiData) {
        let items = this.getPenilaian();
        const existingIndex = items.findIndex(item => item.karyawan_id === karyawan_id);
        
        const payload = {
            karyawan_id: karyawan_id,
            nilai: nilaiData // Object map: { "C1": 5, "C2": 4, ... }
        };

        if (existingIndex !== -1) {
            items[existingIndex] = payload;
        } else {
            items.push(payload);
        }
        this.setData('PENILAIAN', items);
    },
    
    getPenilaianByKaryawan(karyawan_id) {
        const items = this.getPenilaian();
        return items.find(item => item.karyawan_id === karyawan_id) || null;
    }
};

// Initialize on load
Store.init();
