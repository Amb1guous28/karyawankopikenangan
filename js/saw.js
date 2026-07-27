/**
 * Logic for Simple Additive Weighting (SAW) Method
 */

const SAW = {
    calculate() {
        const karyawan = Store.getKaryawan();
        const kriteria = Store.getKriteria();
        const penilaian = Store.getPenilaian();

        if (karyawan.length === 0 || kriteria.length === 0 || penilaian.length === 0) {
            return { error: "Data belum lengkap untuk melakukan perhitungan." };
        }

        // 1. Prepare Matriks Keputusan (X)
        // Only include employees who have been evaluated
        let matriksX = [];
        karyawan.forEach(k => {
            const p = penilaian.find(pen => pen.karyawan_id === k.id);
            if (p && Object.keys(p.nilai).length === kriteria.length) {
                let row = {
                    karyawan_id: k.id,
                    karyawan_kode: k.kode,
                    karyawan_nama: k.nama,
                    posisi: k.posisi,
                    nilai: {}
                };
                kriteria.forEach(kr => {
                    row.nilai[kr.id] = parseFloat(p.nilai[kr.id] || 0);
                });
                matriksX.push(row);
            }
        });

        if (matriksX.length === 0) {
            return { error: "Belum ada karyawan yang dinilai secara lengkap." };
        }

        // 2. Normalisasi Matriks (R)
        // Find max value for each criteria from Subkriteria max possible value
        const subkriteria = Store.getSubkriteria();
        let maxValues = {};
        kriteria.forEach(kr => {
            const subForKr = subkriteria.filter(s => s.kriteria_id === kr.id);
            if (subForKr.length > 0) {
                let maxSub = 0;
                subForKr.forEach(s => {
                    if (s.nilai > maxSub) maxSub = s.nilai;
                });
                maxValues[kr.id] = maxSub;
            } else {
                // If no subcriteria defined, fallback to max value from matrix
                let max = 0;
                matriksX.forEach(row => {
                    if (row.nilai[kr.id] > max) {
                        max = row.nilai[kr.id];
                    }
                });
                maxValues[kr.id] = max || 1; // fallback to 1 to avoid div by zero
            }
        });

        let matriksR = [];
        matriksX.forEach(row => {
            let normRow = {
                karyawan_id: row.karyawan_id,
                karyawan_kode: row.karyawan_kode,
                karyawan_nama: row.karyawan_nama,
                posisi: row.posisi,
                nilai: {}
            };
            kriteria.forEach(kr => {
                // Formula: Benefit = Nilai / Max
                const max = maxValues[kr.id];
                const val = row.nilai[kr.id];
                normRow.nilai[kr.id] = max === 0 ? 0 : val / max;
            });
            matriksR.push(normRow);
        });

        // 3. Hasil Preferensi & Ranking (V)
        let hasilV = [];
        matriksR.forEach(row => {
            let totalScore = 0;
            kriteria.forEach(kr => {
                // V = R * Bobot
                totalScore += row.nilai[kr.id] * parseFloat(kr.bobot);
            });

            hasilV.push({
                karyawan_id: row.karyawan_id,
                karyawan_kode: row.karyawan_kode,
                karyawan_nama: row.karyawan_nama,
                posisi: row.posisi,
                skor: totalScore
            });
        });

        // Sort descending
        hasilV.sort((a, b) => b.skor - a.skor);

        // Assign ranking
        hasilV.forEach((item, index) => {
            item.rank = index + 1;
        });

        const result = {
            kriteria: kriteria,
            matriksX: matriksX,
            matriksR: matriksR,
            hasilV: hasilV,
            timestamp: new Date().toISOString()
        };

        // Save history (optional, currently storing just the latest)
        Store.setData('CALCULATION_HISTORY', result);

        return result;
    },

    getLatestResult() {
        return Store.getData('CALCULATION_HISTORY');
    }
};
