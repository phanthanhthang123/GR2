const { spawnSync } = require('child_process');
const path = require('path');

/**
 * Gọi HM Logistic Regression (Python) để tính KPI lúc tạo tài khoản (Model A hoặc B).
 * Dùng CommonJS để tránh xung đột babel-node / ESM (exports is not defined).
 * HM_ROOT: thư mục HM. Mặc định ../../../HM từ server/src/services.
 */
function predictOnboardingKpi(input) {
    const python = process.env.PYTHON_PATH || 'python';
    const hmRoot = process.env.HM_ROOT || path.resolve(__dirname, '../../../HM');
    const script = path.join(hmRoot, 'src', 'predict_onboarding_cli.py');

    const cpa = input.cpa != null ? input.cpa : input.gpa;
    const payload = JSON.stringify({
        cpa: Number(cpa),
        interview_score: Number(input.interview_score),
        cv_score: Number(input.cv_score),
        years_experience: Number(input.years_experience ?? 0),
        num_projects: Number(input.num_projects ?? 0),
    });

    const r = spawnSync(python, [script], {
        cwd: hmRoot,
        input: payload,
        encoding: 'utf-8',
        maxBuffer: 2 * 1024 * 1024,
        timeout: 20000,
        env: { ...process.env, PYTHONUTF8: '1' },
    });

    if (r.error) {
        console.error('[kpiPython] spawn error:', r.error);
        return { err: 1, kpi: null, model: null, msg: String(r.error) };
    }
    if (r.status !== 0) {
        console.error('[kpiPython] stderr:', r.stderr);
        return {
            err: 1,
            kpi: null,
            model: null,
            msg: (r.stderr && r.stderr.trim()) || `exit ${r.status}`,
        };
    }
    try {
        const out = JSON.parse((r.stdout || '').trim());
        if (out.err) {
            return out;
        }
        return { err: 0, kpi: out.kpi, model: out.model, msg: '' };
    } catch (e) {
        console.error('[kpiPython] parse stdout:', r.stdout);
        return { err: 1, kpi: null, model: null, msg: String(e) };
    }
}

function predictInternalKpi(input) {
    const python = process.env.PYTHON_PATH || 'python';
    const hmRoot = process.env.HM_ROOT || path.resolve(__dirname, '../../../HM');
    const script = path.join(hmRoot, 'src', 'predict_internal_cli.py');

    const payload = JSON.stringify({
        total_projects: Number(input.total_projects ?? 0),
        total_tasks: Number(input.total_tasks ?? 0),
        hard_tasks: Number(input.hard_tasks ?? 0),
        years_at_company: Number(input.years_at_company ?? input.yearsAtCompany ?? 0),
    });

    const r = spawnSync(python, [script], {
        cwd: hmRoot,
        input: payload,
        encoding: 'utf-8',
        maxBuffer: 2 * 1024 * 1024,
        timeout: 20000,
        env: { ...process.env, PYTHONUTF8: '1' },
    });

    if (r.error) {
        console.error('[kpiPython:internal] spawn error:', r.error);
        return { err: 1, kpi: null, model: null, msg: String(r.error) };
    }
    if (r.status !== 0) {
        console.error('[kpiPython:internal] stderr:', r.stderr);
        return {
            err: 1,
            kpi: null,
            model: null,
            msg: (r.stderr && r.stderr.trim()) || `exit ${r.status}`,
        };
    }
    try {
        const out = JSON.parse((r.stdout || '').trim());
        if (out.err) return out;
        return { err: 0, kpi: out.kpi, model: out.model, msg: '' };
    } catch (e) {
        console.error('[kpiPython:internal] parse stdout:', r.stdout);
        return { err: 1, kpi: null, model: null, msg: String(e) };
    }
}

module.exports = { predictOnboardingKpi, predictInternalKpi };
