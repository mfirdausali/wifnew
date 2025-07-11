import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Button } from '../atoms/Button';
import { Select } from '../atoms/Select';
import { Checkbox } from '../atoms/Checkbox';
import { Spinner } from '../atoms/Spinner';
import { Badge } from '../atoms/Badge';
import { closeModal } from '@/store/slices/uiSlice';
import { importUsers } from '@/store/thunks/userThunks';
import { AppDispatch, RootState } from '@/store';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ImportUsersModal.module.css';
import {
  FiUpload,
  FiFile,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiChevronRight,
  FiChevronLeft,
  FiDownload,
  FiRefreshCw
} from 'react-icons/fi';

type ImportStep = 'upload' | 'mapping' | 'review' | 'importing' | 'complete';

interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  isRequired: boolean;
}

interface ImportResult {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

const requiredFields = [
  { value: 'email', label: 'Email', required: true },
  { value: 'firstName', label: 'First Name', required: true },
  { value: 'lastName', label: 'Last Name', required: true },
  { value: 'role', label: 'Role', required: true },
  { value: 'departmentId', label: 'Department', required: true },
  { value: 'position', label: 'Position', required: false },
  { value: 'phoneNumber', label: 'Phone Number', required: false }
];

export const ImportUsersModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const isOpen = useSelector((state: RootState) => state.ui.modals.importUsers);
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [importOptions, setImportOptions] = useState({
    updateExisting: false,
    skipDuplicates: true,
    validateEmails: true,
    sendWelcomeEmails: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleClose = () => {
    if (!isProcessing) {
      dispatch(closeModal('importUsers'));
      // Reset state
      setCurrentStep('upload');
      setFile(null);
      setParsedData([]);
      setColumnMappings([]);
      setImportResult(null);
    }
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(uploadedFile.type)) {
      alert('Please upload a CSV or Excel file');
      return;
    }

    setFile(uploadedFile);
    
    // Parse file (simplified - in real app would use Papa Parse or similar)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Auto-detect column mappings
      const mappings: ColumnMapping[] = headers.map(header => {
        const targetField = requiredFields.find(field => 
          header.toLowerCase().includes(field.value.toLowerCase()) ||
          field.label.toLowerCase().includes(header.toLowerCase())
        );
        
        return {
          sourceColumn: header,
          targetField: targetField?.value || '',
          isRequired: targetField?.required || false
        };
      });
      
      setColumnMappings(mappings);
      
      // Parse data rows
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',');
        const row: any = { _rowIndex: index + 2 };
        headers.forEach((header, i) => {
          row[header] = values[i]?.trim() || '';
        });
        return row;
      }).filter(row => Object.values(row).some(v => v));
      
      setParsedData(data);
      setCurrentStep('mapping');
    };
    
    reader.readAsText(uploadedFile);
  }, []);

  const handleMappingChange = (index: number, targetField: string) => {
    const newMappings = [...columnMappings];
    newMappings[index].targetField = targetField;
    setColumnMappings(newMappings);
  };

  const validateMappings = () => {
    const mappedFields = columnMappings.map(m => m.targetField).filter(Boolean);
    const requiredMapped = requiredFields
      .filter(f => f.required)
      .every(f => mappedFields.includes(f.value));
    
    return requiredMapped;
  };

  const handleImport = async () => {
    setCurrentStep('importing');
    setIsProcessing(true);
    
    try {
      // Transform data based on mappings
      const transformedData = parsedData.map(row => {
        const user: any = {};
        columnMappings.forEach(mapping => {
          if (mapping.targetField) {
            user[mapping.targetField] = row[mapping.sourceColumn];
          }
        });
        return user;
      });
      
      const result = await dispatch(importUsers({
        data: transformedData,
        options: importOptions
      })).unwrap();
      
      setImportResult(result);
      setCurrentStep('complete');
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className={styles.uploadStep}>
            <div className={styles.uploadArea}>
              <input
                type="file"
                id="file-upload"
                className={styles.fileInput}
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
              <label htmlFor="file-upload" className={styles.uploadLabel}>
                <FiUpload className={styles.uploadIcon} />
                <span className={styles.uploadText}>
                  Click to upload or drag and drop
                </span>
                <span className={styles.uploadHint}>
                  CSV or Excel files up to 10MB
                </span>
              </label>
            </div>
            
            <div className={styles.templateSection}>
              <h3>Need a template?</h3>
              <p>Download our template file with the correct format and headers.</p>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FiDownload />}
              >
                Download Template
              </Button>
            </div>
            
            <div className={styles.requirements}>
              <h3>File Requirements</h3>
              <ul>
                <li>Must contain headers in the first row</li>
                <li>Required fields: Email, First Name, Last Name, Role, Department</li>
                <li>Supported formats: CSV, Excel (.xlsx, .xls)</li>
                <li>Maximum file size: 10MB</li>
                <li>Maximum records: 1000 per import</li>
              </ul>
            </div>
          </div>
        );

      case 'mapping':
        return (
          <div className={styles.mappingStep}>
            <div className={styles.mappingHeader}>
              <h3>Map Columns</h3>
              <p>Match your file columns to the system fields</p>
            </div>
            
            <div className={styles.fileInfo}>
              <FiFile />
              <span>{file?.name}</span>
              <Badge variant="info" size="sm">{parsedData.length} rows</Badge>
            </div>
            
            <div className={styles.mappingTable}>
              <div className={styles.mappingHeader}>
                <span>Your Column</span>
                <span>Maps To</span>
                <span>Sample Data</span>
              </div>
              
              {columnMappings.map((mapping, index) => (
                <div key={index} className={styles.mappingRow}>
                  <span className={styles.sourceColumn}>
                    {mapping.sourceColumn}
                  </span>
                  <Select
                    value={mapping.targetField}
                    onChange={(e) => handleMappingChange(index, e.target.value)}
                    className={styles.mappingSelect}
                    options={[
                      { value: '', label: 'Skip this column' },
                      ...requiredFields.map(field => ({
                        value: field.value,
                        label: field.label + (field.required ? ' *' : '')
                      }))
                    ]}
                  />
                  <span className={styles.sampleData}>
                    {parsedData[0]?.[mapping.sourceColumn] || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
            
            {!validateMappings() && (
              <div className={styles.warningBox}>
                <FiAlertCircle />
                <span>Please map all required fields before proceeding</span>
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className={styles.reviewStep}>
            <h3>Review Import Settings</h3>
            
            <div className={styles.importSummary}>
              <div className={styles.summaryItem}>
                <span>Total Records:</span>
                <strong>{parsedData.length}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>File:</span>
                <strong>{file?.name}</strong>
              </div>
            </div>
            
            <div className={styles.importOptions}>
              <h4>Import Options</h4>
              <Checkbox
                checked={importOptions.updateExisting}
                onChange={(checked) => setImportOptions(prev => ({ ...prev, updateExisting: checked }))}
                label="Update existing users (match by email)"
              />
              <Checkbox
                checked={importOptions.skipDuplicates}
                onChange={(checked) => setImportOptions(prev => ({ ...prev, skipDuplicates: checked }))}
                label="Skip duplicate entries"
              />
              <Checkbox
                checked={importOptions.validateEmails}
                onChange={(checked) => setImportOptions(prev => ({ ...prev, validateEmails: checked }))}
                label="Validate email addresses"
              />
              <Checkbox
                checked={importOptions.sendWelcomeEmails}
                onChange={(checked) => setImportOptions(prev => ({ ...prev, sendWelcomeEmails: checked }))}
                label="Send welcome emails to new users"
              />
            </div>
            
            <div className={styles.dataPreview}>
              <h4>Data Preview (First 5 Records)</h4>
              <div className={styles.previewTable}>
                {parsedData.slice(0, 5).map((row, index) => (
                  <div key={index} className={styles.previewRow}>
                    <span className={styles.rowNumber}>#{index + 1}</span>
                    <div className={styles.rowData}>
                      {columnMappings
                        .filter(m => m.targetField)
                        .map(mapping => (
                          <div key={mapping.targetField} className={styles.previewField}>
                            <span className={styles.fieldLabel}>
                              {requiredFields.find(f => f.value === mapping.targetField)?.label}:
                            </span>
                            <span className={styles.fieldValue}>
                              {row[mapping.sourceColumn] || 'N/A'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'importing':
        return (
          <div className={styles.importingStep}>
            <Spinner size="xl" />
            <h3>Importing Users</h3>
            <p>Please wait while we process your file...</p>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: '60%' }} />
            </div>
            <span className={styles.progressText}>Processing row 60 of 100</span>
          </div>
        );

      case 'complete':
        return (
          <div className={styles.completeStep}>
            <div className={styles.resultIcon}>
              {importResult && importResult.errors.length === 0 ? (
                <FiCheckCircle className={styles.successIcon} />
              ) : (
                <FiAlertCircle className={styles.warningIcon} />
              )}
            </div>
            
            <h3>Import Complete</h3>
            
            {importResult && (
              <>
                <div className={styles.resultStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{importResult.imported}</span>
                    <span className={styles.statLabel}>Imported</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{importResult.updated}</span>
                    <span className={styles.statLabel}>Updated</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{importResult.skipped}</span>
                    <span className={styles.statLabel}>Skipped</span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className={styles.statItem}>
                      <span className={styles.statValue}>{importResult.errors.length}</span>
                      <span className={styles.statLabel}>Errors</span>
                    </div>
                  )}
                </div>
                
                {importResult.errors.length > 0 && (
                  <div className={styles.errorsList}>
                    <h4>Import Errors</h4>
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className={styles.errorItem}>
                        <span>Row {error.row}:</span>
                        <span>{error.field} - {error.message}</span>
                      </div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <p className={styles.moreErrors}>
                        And {importResult.errors.length - 5} more errors...
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepNumber = () => {
    const steps: ImportStep[] = ['upload', 'mapping', 'review', 'importing', 'complete'];
    return steps.indexOf(currentStep) + 1;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      closeOnOverlayClick={false}
    >
      <ModalHeader>
        <div className={styles.header}>
          <h2 className={styles.title}>Import Users</h2>
          {currentStep !== 'complete' && (
            <div className={styles.steps}>
              <span className={styles.stepIndicator}>
                Step {getStepNumber()} of 3
              </span>
            </div>
          )}
        </div>
      </ModalHeader>
      
      <ModalBody>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </ModalBody>
      
      <ModalFooter>
        {currentStep === 'upload' && (
          <>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button disabled>
              Next
            </Button>
          </>
        )}
        
        {currentStep === 'mapping' && (
          <>
            <Button variant="outline" onClick={() => setCurrentStep('upload')}>
              Back
            </Button>
            <Button
              onClick={() => setCurrentStep('review')}
              disabled={!validateMappings()}
              rightIcon={<FiChevronRight />}
            >
              Continue
            </Button>
          </>
        )}
        
        {currentStep === 'review' && (
          <>
            <Button
              variant="outline"
              onClick={() => setCurrentStep('mapping')}
              leftIcon={<FiChevronLeft />}
            >
              Back
            </Button>
            <Button
              onClick={handleImport}
              leftIcon={<FiUpload />}
            >
              Import {parsedData.length} Users
            </Button>
          </>
        )}
        
        {currentStep === 'complete' && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep('upload');
                setFile(null);
                setParsedData([]);
                setImportResult(null);
              }}
              leftIcon={<FiRefreshCw />}
            >
              Import More
            </Button>
            <Button onClick={handleClose}>
              Done
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
};