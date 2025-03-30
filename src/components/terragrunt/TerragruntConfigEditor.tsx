import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Textarea from '../ui/Textarea';
import { Save, RefreshCw } from 'lucide-react';

interface TerragruntConfigEditorProps {
  initialContent: string;
  title: string;
  path: string;
  onSave: (content: string) => Promise<void>;
}

const TerragruntConfigEditor: React.FC<TerragruntConfigEditorProps> = ({
  initialContent,
  title,
  path,
  onSave,
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
      await onSave(content);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setContent(initialContent);
    setError(null);
  };

  return (
    <Card 
      title={title}
      subtitle={path}
      className="h-full"
      footer={
        <div className="flex justify-between items-center">
          <div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {saveSuccess && <p className="text-sm text-green-600">Configuration saved successfully!</p>}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isSaving}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Save
            </Button>
          </div>
        </div>
      }
    >
      <Textarea
        id="terragrunt-config"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="font-mono text-sm h-96"
        fullWidth
      />
    </Card>
  );
};

export default TerragruntConfigEditor;
