import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Trash2, Edit2, Mail, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

function App() {
  const [certificates, setCertificates] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [emailConfig, setEmailConfig] = useState({ email: '', enabled: false });
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    expirationDate: '',
    issuer: '',
    type: 'SSL/TLS'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const certsData = localStorage.getItem('certificates');
      const emailData = localStorage.getItem('email-config');
      
      if (certsData) {
        setCertificates(JSON.parse(certsData));
      }
      if (emailData) {
        setEmailConfig(JSON.parse(emailData));
      }
    } catch (error) {
      console.log('No hay datos previos');
    }
  };

  const saveData = (certs, email) => {
    try {
      localStorage.setItem('certificates', JSON.stringify(certs));
      if (email) {
        localStorage.setItem('email-config', JSON.stringify(email));
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };

  const getDaysUntilExpiration = (date) => {
    const today = new Date();
    const expiration = new Date(date);
    const diffTime = expiration - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatus = (days) => {
    if (days < 0) return { text: 'Expirado', color: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle };
    if (days <= 30) return { text: 'Crítico', color: 'text-orange-400', bg: 'bg-orange-500/10', icon: AlertCircle };
    if (days <= 60) return { text: 'Advertencia', color: 'text-yellow-400', bg: 'bg-yellow-500/10', icon: Clock };
    return { text: 'Válido', color: 'text-green-400', bg: 'bg-green-500/10', icon: CheckCircle };
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.domain || !formData.expirationDate || !formData.issuer) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    const newCert = {
      id: editingId || Date.now().toString(),
      ...formData,
      createdAt: editingId ? certificates.find(c => c.id === editingId).createdAt : new Date().toISOString()
    };

    let updatedCerts;
    if (editingId) {
      updatedCerts = certificates.map(cert => cert.id === editingId ? newCert : cert);
    } else {
      updatedCerts = [...certificates, newCert];
    }

    setCertificates(updatedCerts);
    saveData(updatedCerts, emailConfig);

    const days = getDaysUntilExpiration(newCert.expirationDate);
    if (days <= 30 && days >= 0 && emailConfig.enabled) {
      sendEmailNotification(newCert, days);
    }

    resetForm();
  };

  const sendEmailNotification = (cert, days) => {
    console.log(`Enviando notificación a ${emailConfig.email} sobre ${cert.name} (${days} días restantes)`);
    alert(`Notificación enviada a ${emailConfig.email}:\n\nEl certificado "${cert.name}" expira en ${days} días.`);
  };

  const handleDelete = (id) => {
    const updatedCerts = certificates.filter(cert => cert.id !== id);
    setCertificates(updatedCerts);
    saveData(updatedCerts, emailConfig);
  };

  const handleEdit = (cert) => {
    setFormData({
      name: cert.name,
      domain: cert.domain,
      expirationDate: cert.expirationDate,
      issuer: cert.issuer,
      type: cert.type
    });
    setEditingId(cert.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      expirationDate: '',
      issuer: '',
      type: 'SSL/TLS'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEmailConfigSave = () => {
    saveData(certificates, emailConfig);
    alert('Configuración de email guardada correctamente');
  };

  const stats = {
    total: certificates.length,
    expired: certificates.filter(c => getDaysUntilExpiration(c.expirationDate) < 0).length,
    critical: certificates.filter(c => {
      const days = getDaysUntilExpiration(c.expirationDate);
      return days >= 0 && days <= 30;
    }).length,
    valid: certificates.filter(c => getDaysUntilExpiration(c.expirationDate) > 30).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-100">
      <div className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Certificate Manager TTC-INFRASTRUCTURE</h1>
                <p className="text-sm text-gray-400">AWS - MIC</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>Nuevo Certificado</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Total</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-gray-800 border border-green-500/20 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Válidos</div>
            <div className="text-3xl font-bold text-green-400">{stats.valid}</div>
          </div>
          <div className="bg-gray-800 border border-orange-500/20 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Críticos</div>
            <div className="text-3xl font-bold text-orange-400">{stats.critical}</div>
          </div>
          <div className="bg-gray-800 border border-red-500/20 rounded-lg p-6">
            <div className="text-gray-400 text-sm mb-2">Expirados</div>
            <div className="text-3xl font-bold text-red-400">{stats.expired}</div>
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Mail className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold text-white">Configuración de Notificaciones</h2>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="email"
              placeholder="tu@email.com"
              value={emailConfig.email}
              onChange={(e) => setEmailConfig({ ...emailConfig, email: e.target.value })}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            />
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={emailConfig.enabled}
                onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
                className="w-4 h-4 text-orange-500 bg-gray-900 border-gray-600 rounded focus:ring-orange-500"
              />
              <span className="text-gray-300">Activar notificaciones</span>
            </label>
            <button
              onClick={handleEmailConfigSave}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Guardar
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Recibirás un correo 30 días antes del vencimiento de cada certificado
          </p>
        </div>

        {showForm && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              {editingId ? 'Editar Certificado' : 'Nuevo Certificado'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    placeholder="Certificado Principal"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Dominio</label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    placeholder="*.ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Fecha de Expiración</label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Emisor</label>
                  <input
                    type="text"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                    placeholder="AWS Certificate Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option>SSL/TLS</option>
                    <option>Code Signing</option>
                    <option>S/MIME</option>
                    <option>Client Certificate</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                >
                  {editingId ? 'Actualizar' : 'Agregar'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Certificados</h2>
          </div>
          <div className="divide-y divide-gray-700">
            {certificates.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No hay certificados registrados. Agrega uno para comenzar.
              </div>
            ) : (
              certificates.map((cert) => {
                const days = getDaysUntilExpiration(cert.expirationDate);
                const status = getStatus(days);
                const StatusIcon = status.icon;

                return (
                  <div key={cert.id} className="px-6 py-4 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{cert.name}</h3>
                          <span className={`flex items-center space-x-1 px-2 py-1 ${status.bg} ${status.color} rounded text-xs font-medium`}>
                            <StatusIcon className="w-3 h-3" />
                            <span>{status.text}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Dominio:</span>
                            <p className="text-gray-200 font-mono">{cert.domain}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Expira:</span>
                            <p className="text-gray-200">{new Date(cert.expirationDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Días restantes:</span>
                            <p className={`font-bold ${status.color}`}>{days > 0 ? days : 'Expirado'}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Emisor:</span>
                            <p className="text-gray-200">{cert.issuer}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(cert)}
                          className="p-2 text-gray-400 hover:text-orange-500 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cert.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;