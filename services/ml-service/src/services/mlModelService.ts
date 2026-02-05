import { EventEmitter } from "events";

export interface ModelConfig {
  modelId: string;
  name: string;
  type: "classification" | "regression" | "clustering" | "recommendation";
  algorithm: string;
  hyperparameters: Record<string, any>;
  trainingDataSize?: number;
  testDataSize?: number;
  validationDataSize?: number;
  features: string[];
  targetVariable?: string;
  version: string;
  createdDate: Date;
  lastTrainedDate?: Date;
  isActive: boolean;
}

export interface TrainingMetrics {
  modelId: string;
  epoch: number;
  loss: number;
  accuracy: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  validationLoss?: number;
  validationAccuracy?: number;
  rmse?: number; // For regression
  mse?: number; // Mean squared error
  mae?: number; // Mean absolute error
  runtimeSeconds: number;
  timestamp: Date;
}

export interface HyperparameterConfig {
  learningRate: number;
  batchSize: number;
  epochs: number;
  optimizer: "adam" | "sgd" | "rmsprop";
  regularization: "l1" | "l2" | "elastic-net" | "none";
  regularizationStrength: number;
  dropout: number;
  earlyStopping: boolean;
  patienceEpochs: number;
}

export interface ModelPerformance {
  modelId: string;
  trainAccuracy: number;
  testAccuracy: number;
  validationAccuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc?: number;
  confusionMatrix?: number[][];
  bestEpoch: number;
  trainingTime: number; // minutes
  inferenceTime: number; // ms per sample
}

export class MLModelService extends EventEmitter {
  private models: Map<string, ModelConfig> = new Map();
  private trainingMetrics: Map<string, TrainingMetrics[]> = new Map();
  private modelPerformance: Map<string, ModelPerformance> = new Map();
  private trainingJobs: Map<
    string,
    { status: string; progress: number; startTime: Date }
  > = new Map();
  private hyperparameterHistory: Map<string, HyperparameterConfig[]> =
    new Map();

  constructor() {
    super();
  }

  // Create new model
  createModel(
    config: Omit<ModelConfig, "modelId" | "createdDate" | "isActive">,
  ): ModelConfig {
    const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const model: ModelConfig = {
      ...config,
      modelId,
      createdDate: new Date(),
      isActive: false,
    };

    this.models.set(modelId, model);
    this.trainingMetrics.set(modelId, []);
    this.hyperparameterHistory.set(modelId, []);

    this.emit("model:created", {
      modelId,
      name: model.name,
      algorithm: model.algorithm,
    });

    return model;
  }

  // Start training
  async startTraining(
    modelId: string,
    trainingData: any[],
    hyperparameters?: Partial<HyperparameterConfig>,
  ): Promise<string> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error("Model not found");
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const defaultHyperparameters: HyperparameterConfig = {
      learningRate: 0.001,
      batchSize: 32,
      epochs: 100,
      optimizer: "adam",
      regularization: "l2",
      regularizationStrength: 0.0001,
      dropout: 0.2,
      earlyStopping: true,
      patienceEpochs: 10,
      ...hyperparameters,
    };

    this.hyperparameterHistory.get(modelId)!.push(defaultHyperparameters);

    this.trainingJobs.set(jobId, {
      status: "running",
      progress: 0,
      startTime: new Date(),
    });

    this.emit("training:started", {
      jobId,
      modelId,
      modelName: model.name,
      dataSize: trainingData.length,
      hyperparameters: defaultHyperparameters,
    });

    // Simulate training
    this.simulateTraining(
      modelId,
      jobId,
      defaultHyperparameters,
      trainingData.length,
    );

    return jobId;
  }

  private async simulateTraining(
    modelId: string,
    jobId: string,
    hyperparameters: HyperparameterConfig,
    dataSize: number,
  ): Promise<void> {
    const model = this.models.get(modelId)!;
    const metrics = this.trainingMetrics.get(modelId)!;
    let bestValidationAccuracy = 0;
    let patienceCounter = 0;

    for (let epoch = 1; epoch <= hyperparameters.epochs; epoch++) {
      // Simulate metric calculation
      const loss = Math.exp(-epoch / 20) * 2.0;
      const accuracy = 1 - Math.exp(-epoch / 15);
      const validationAccuracy = 1 - Math.exp(-epoch / 18) - 0.05;
      const validationLoss = Math.exp(-epoch / 20) * 2.1;

      const metric: TrainingMetrics = {
        modelId,
        epoch,
        loss,
        accuracy,
        validationAccuracy,
        validationLoss,
        precision: accuracy * 0.95,
        recall: accuracy * 0.92,
        f1Score:
          (accuracy * 0.95 * accuracy * 0.92 * 2) /
          (accuracy * 0.95 + accuracy * 0.92),
        runtimeSeconds:
          Math.floor(dataSize / (hyperparameters.batchSize * 100)) * 2,
        timestamp: new Date(),
      };

      metrics.push(metric);

      const job = this.trainingJobs.get(jobId);
      if (job) {
        job.progress = (epoch / hyperparameters.epochs) * 100;
      }

      this.emit("training:epoch-completed", {
        jobId,
        epoch,
        loss,
        accuracy,
        validationAccuracy,
        progress: job?.progress || 0,
      });

      // Early stopping check
      if (hyperparameters.earlyStopping) {
        if (validationAccuracy > bestValidationAccuracy) {
          bestValidationAccuracy = validationAccuracy;
          patienceCounter = 0;
        } else {
          patienceCounter++;
          if (patienceCounter >= hyperparameters.patienceEpochs) {
            this.emit("training:early-stopped", {
              jobId,
              epoch,
              bestValidationAccuracy,
            });
            break;
          }
        }
      }

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Complete training
    model.lastTrainedDate = new Date();
    const job = this.trainingJobs.get(jobId);
    if (job) {
      job.status = "completed";
      job.progress = 100;
    }

    // Calculate final performance
    this.calculateModelPerformance(modelId);

    this.emit("training:completed", {
      jobId,
      modelId,
      modelName: model.name,
      bestValidationAccuracy,
      epochsTrained: metrics.length,
      trainingTimeMinutes: Math.floor(
        (new Date().getTime() - (job?.startTime.getTime() || 0)) / 60000,
      ),
    });
  }

  private calculateModelPerformance(modelId: string): void {
    const metrics = this.trainingMetrics.get(modelId) || [];
    if (metrics.length === 0) return;

    const finalMetric = metrics[metrics.length - 1];
    const bestAccuracy = Math.max(...metrics.map((m) => m.accuracy));
    const bestEpoch = metrics.findIndex((m) => m.accuracy === bestAccuracy) + 1;

    const performance: ModelPerformance = {
      modelId,
      trainAccuracy: finalMetric.accuracy,
      testAccuracy: finalMetric.accuracy * 0.98,
      validationAccuracy: finalMetric.validationAccuracy,
      precision: finalMetric.precision || 0,
      recall: finalMetric.recall || 0,
      f1Score: finalMetric.f1Score || 0,
      rocAuc: finalMetric.accuracy * 0.95,
      bestEpoch,
      trainingTime: Math.floor(
        metrics.reduce((sum, m) => sum + m.runtimeSeconds, 0) / 60,
      ),
      inferenceTime: Math.random() * 100 + 10, // 10-110ms
    };

    this.modelPerformance.set(modelId, performance);

    this.emit("performance:calculated", {
      modelId,
      accuracy: performance.testAccuracy,
      f1Score: performance.f1Score,
      inferenceTime: performance.inferenceTime,
    });
  }

  // Tune hyperparameters (grid search)
  async tuneHyperparameters(
    modelId: string,
    parameterGridOptions: Record<string, any[]>,
    trainingData: any[],
    validationData: any[],
  ): Promise<{ bestParameters: HyperparameterConfig; bestScore: number }> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error("Model not found");
    }

    const jobId = `tune_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.trainingJobs.set(jobId, {
      status: "running",
      progress: 0,
      startTime: new Date(),
    });

    this.emit("tuning:started", {
      jobId,
      modelId,
      gridSize: this.calculateGridSize(parameterGridOptions),
    });

    // Grid search simulation
    const combinations =
      this.generateParameterCombinations(parameterGridOptions);
    let bestScore = 0;
    let bestParameters: HyperparameterConfig | null = null;

    for (let i = 0; i < combinations.length; i++) {
      const params = combinations[i];

      // Train with these parameters
      const score = Math.random() * 0.2 + 0.75; // Simulate scores 0.75-0.95

      if (score > bestScore) {
        bestScore = score;
        bestParameters = params;
      }

      const job = this.trainingJobs.get(jobId);
      if (job) {
        job.progress = ((i + 1) / combinations.length) * 100;
      }

      this.emit("tuning:iteration-completed", {
        jobId,
        iteration: i + 1,
        totalIterations: combinations.length,
        score,
        bestScore,
        progress: job?.progress || 0,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const job = this.trainingJobs.get(jobId);
    if (job) {
      job.status = "completed";
      job.progress = 100;
    }

    this.emit("tuning:completed", {
      jobId,
      modelId,
      bestScore,
      bestParameters,
    });

    return {
      bestParameters: bestParameters!,
      bestScore,
    };
  }

  private generateParameterCombinations(
    parameterGrid: Record<string, any[]>,
  ): HyperparameterConfig[] {
    const combinations: HyperparameterConfig[] = [];
    const keys = Object.keys(parameterGrid);

    const generate = (index: number, current: Record<string, any>) => {
      if (index === keys.length) {
        combinations.push(current as HyperparameterConfig);
        return;
      }

      const key = keys[index];
      const values = parameterGrid[key];

      values.forEach((value) => {
        generate(index + 1, { ...current, [key]: value });
      });
    };

    generate(0, {});
    return combinations;
  }

  private calculateGridSize(parameterGrid: Record<string, any[]>): number {
    return Object.values(parameterGrid).reduce(
      (product, arr) => product * arr.length,
      1,
    );
  }

  // Get training history
  getTrainingHistory(modelId: string): TrainingMetrics[] {
    return this.trainingMetrics.get(modelId) || [];
  }

  // Get model performance
  getModelPerformance(modelId: string): ModelPerformance | undefined {
    return this.modelPerformance.get(modelId);
  }

  // Get all models
  getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  // Get model
  getModel(modelId: string): ModelConfig | undefined {
    return this.models.get(modelId);
  }

  // Activate model
  activateModel(modelId: string): void {
    const model = this.models.get(modelId);
    if (!model) return;

    // Deactivate all other models
    for (const m of this.models.values()) {
      m.isActive = false;
    }

    model.isActive = true;

    this.emit("model:activated", {
      modelId,
      modelName: model.name,
    });
  }

  // Get job status
  getJobStatus(
    jobId: string,
  ): { status: string; progress: number } | undefined {
    const job = this.trainingJobs.get(jobId);
    if (!job) return undefined;

    return {
      status: job.status,
      progress: job.progress,
    };
  }

  // Get hyperparameter history
  getHyperparameterHistory(modelId: string): HyperparameterConfig[] {
    return this.hyperparameterHistory.get(modelId) || [];
  }
}

export const mlModelService = new MLModelService();

export default MLModelService;
