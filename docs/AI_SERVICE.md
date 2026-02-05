# AI Service Architecture & Implementation

## Overview

The AI Service is a comprehensive microservice providing intelligent features for the EduPrep platform. It processes student learning data, makes predictions, and provides personalized recommendations using machine learning algorithms.

## Service Components

### 1. Question Recommender Service (350 lines)

**Purpose**: Deliver personalized question recommendations based on student learning patterns

**Key Features**:

- **Personalized Recommendations**: Analyzes student performance profile to recommend relevant questions
  - Considers difficulty alignment (performance within 70% success rate)
  - Evaluates topic strength and weakness
  - Applies spaced repetition principles
  - Uses learning progression heuristics

- **Scoring Algorithm**: Multi-factor relevance scoring
  - Difficulty alignment: 25 points (optimal when student scores ~70%)
  - Topic strength: 25 points (prioritizes weak areas)
  - Learning progression: 20 points (builds on mastered topics)
  - Recency boost: 15 points (encourages spaced repetition)
  - Weakness focus: 15 points (targeted practice)

- **Cohort-based Recommendations**: Suggests questions popular among similar students
- **Learning Analytics**: Tracks progress, velocity, and identified weak areas
- **Difficulty Prediction**: Estimates difficulty of new questions using text complexity analysis

**API Endpoints**:

```
GET /api/ai/recommendations - Get personalized questions
GET /api/ai/recommendations/cohort - Get cohort recommendations
GET /api/ai/recommendations/analytics - View learning analytics
```

### 2. Adaptive Learning Paths Service (300 lines)

**Purpose**: Create personalized learning journeys that adapt to student progress

**Key Features**:

- **Path Generation**: Creates hierarchical learning structure
  - Analyzes all topics in a subject
  - Organizes topics with prerequisites
  - Assigns difficulty levels dynamically
  - Creates milestone-based progression

- **Dynamic Difficulty Adjustment**:
  - Increases difficulty when scoring > 85%
  - Decreases difficulty when scoring < 50%
  - Real-time adjustment based on performance

- **Progress Tracking**:
  - Node-level completion tracking
  - Milestone achievement tracking
  - Performance trend analysis
  - Estimated completion time

- **Next Step Recommendations**:
  - Remedial content for struggling nodes
  - Progressive advancement paths
  - Challenge questions for advanced learners

**API Endpoints**:

```
POST /api/ai/learning-paths - Create new path
GET /api/ai/learning-paths/:pathId - View path details
PUT /api/ai/learning-paths/:pathId/progress - Update progress
GET /api/ai/learning-paths/:pathId/next-steps - Get recommendations
GET /api/ai/learning-paths/:pathId/analytics - View analytics
```

### 3. Performance Prediction Service (250 lines)

**Purpose**: Predict student performance and identify intervention needs

**Key Features**:

- **Test Score Prediction**:
  - Weighted linear regression model
  - Features: overall mean (40%), recent performance (30%), topic-specific (20%), velocity (10%)
  - Confidence scoring via consistency analysis
  - Score range with standard deviation

- **Struggle Prediction**:
  - Identifies topics where student will struggle
  - Recommends intervention type (practice, tutoring, review, simplify)
  - Suggests targeted resources

- **Intervention Needs**:
  - Real-time performance monitoring
  - Automatic alert generation
  - Resource recommendations by intervention type

- **Success Probability**: Calculates probability of passing test using normal distribution

**Algorithm Details**:

```
predicted_score =
  (overall_mean × 0.4) +
  (recent_performance × 0.3) +
  (topic_average × 0.2) +
  (learning_velocity × 0.1)

confidence = consistency_score = 1 / (1 + coefficient_of_variation)

success_probability = CDF(z) where z = (predicted_score - 60) / 15
```

**API Endpoints**:

```
POST /api/ai/predictions/test-score - Predict test score
GET /api/ai/predictions/interventions - Get intervention needs
GET /api/ai/predictions/alerts - Get performance alerts
```

### 4. Plagiarism Detection Service (200 lines)

**Purpose**: Detect academic integrity violations and plagiarism

**Key Features**:

- **Similarity Detection**:
  - N-gram based matching (5-grams default)
  - Section-based similarity analysis
  - Minimum match length of 10 words
  - Merges overlapping matches

- **Paraphrasing Detection**:
  - Semantic tokenization
  - Common token analysis
  - Accounts for rewording and restructuring

- **Suspicious Pattern Detection**:
  - Unusual sentence length variations
  - Citation format issues
  - Excessive quote density
  - Style inconsistencies

- **Risk Assessment**:
  - Low: < 50% similarity
  - Medium: 50-70% similarity
  - High: 70-90% similarity
  - Critical: > 90% similarity or multiple high suspicion sections

- **Detailed Reporting**:
  - Flagged sections with context
  - Match sources and percentages
  - Actionable recommendations

**API Endpoints**:

```
POST /api/ai/plagiarism/check - Check essay
POST /api/ai/plagiarism/detect-paraphrasing - Detect paraphrasing
POST /api/ai/plagiarism/detect-patterns - Detect patterns
POST /api/ai/plagiarism/report - Generate report
```

### 5. Smart Test Scheduling Service (100 lines)

**Purpose**: Optimize test scheduling based on readiness and constraints

**Key Features**:

- **Readiness Assessment**:
  - Topic coverage scoring
  - Performance-based readiness
  - Preparation time estimation
  - Actionable recommendations

- **Schedule Recommendation**:
  - Optimal date calculation based on prep needed
  - Optimal time prediction (morning/afternoon/evening)
  - Weekend exclusion
  - Alternative date suggestions

- **Preparation Planning**:
  - Study schedule generation
  - Daily topic distribution
  - Hour allocation
  - Break recommendations

- **Group Scheduling**:
  - Find common available time
  - Minimize scheduling conflicts
  - Average readiness calculation
  - Optimal date for entire group

**API Endpoints**:

```
POST /api/ai/scheduling/recommend - Get recommendation
POST /api/ai/scheduling/readiness - Assess readiness
POST /api/ai/scheduling/group - Optimize group schedule
POST /api/ai/scheduling/study-plan - Get study plan
```

## Data Models

### StudentPerformance

```typescript
{
  userId: string;
  attemptHistory: [{
    timestamp: Date;
    questionId: string;
    subject: string;
    topic: string;
    difficulty: string;
    score: number;
    timeSpent: number;
  }];
  averageScore: number;
  performanceBySubject: Record<string, number>;
  performanceByDifficulty: Record<string, number>;
}
```

### LearningPath

```typescript
{
  userId: string;
  subject: string;
  targetLevel: string;
  pathStructure: {
    nodes: [{
      id: string;
      topic: string;
      difficulty: string;
      prerequisites: string[];
      estimatedDuration: number;
      masteryThreshold: number;
    }];
  };
  currentNodeId: string;
  completedNodes: string[];
  strugglingNodes: string[];
  progress: number;
  milestones: Milestone[];
}
```

## ML Algorithms & Techniques

### 1. Collaborative Filtering

- Used for cohort recommendations
- Finds students with similar performance patterns
- Recommends questions successful for similar cohorts

### 2. Content-Based Filtering

- Analyzes question characteristics (difficulty, topic, duration)
- Matches with student profile
- Recommends based on content similarity

### 3. Linear Regression

- Performance prediction model
- Weighted feature combination
- Confidence scoring via consistency metrics

### 4. N-gram Analysis

- Plagiarism detection
- Text similarity measurement
- Pattern recognition

### 5. Spaced Repetition

- Question recommendation spacing
- Optimal review timing
- Long-term retention optimization

## Integration Points

### Incoming Dependencies

- **StudentPerformance Model**: Tracks all student attempts
- **Question Model**: Question metadata and content
- **Test Model**: Test definitions
- **Authentication Service**: User verification

### Outgoing Dependencies

- **Analytics Service**: Performance metrics
- **Notification Service**: Alert distribution
- **Database**: Persistent storage

## Performance Characteristics

### Response Times

- Recommendations: < 500ms
- Predictions: < 1000ms
- Plagiarism check: < 2000ms
- Scheduling: < 500ms

### Scalability

- Horizontal scaling via load balancer
- Caching for repeated requests
- Batch processing for bulk operations
- Async processing for long-running tasks

## Security Considerations

- JWT authentication for all endpoints
- Role-based authorization (student/instructor/admin)
- Data validation on all inputs
- CORS protection
- Rate limiting per user
- Sensitive data encryption
- Audit logging for plagiarism reports

## Configuration

```typescript
DEFAULT_AI_CONFIG = {
  questionRecommender: {
    enabled: true,
    minDataPoints: 5,
    cohortSize: 10,
  },
  adaptiveLearning: {
    enabled: true,
    milestonesPerPath: 5,
    minMasteryThreshold: 75,
  },
  performancePrediction: {
    enabled: true,
    confidenceThreshold: 0.7,
    interventionTrigger: 60,
  },
  plagiarismDetection: {
    enabled: true,
    similarityThreshold: 0.8,
    minMatchLength: 10,
  },
  smartScheduling: {
    enabled: true,
    prepTimePerSubjectHour: 1.5,
    hoursPerDay: 2,
  },
};
```

## Implementation Stats

- **Total Lines**: ~1,200 lines
- **Service Count**: 5 major services
- **API Endpoints**: 20+ endpoints
- **ML Algorithms**: 5+ distinct approaches
- **Database Models**: 3+ integrated models

## Future Enhancements

1. **Advanced ML Models**
   - Deep learning for recommendation
   - NLP for essay analysis
   - Computer vision for diagram understanding

2. **Real-time Collaboration**
   - Live study session recommendations
   - Real-time adaptive content
   - Peer matching algorithms

3. **Advanced Analytics**
   - Learning style detection
   - Cognitive load assessment
   - Knowledge graph construction

4. **Personalization Engine**
   - Fine-grained difficulty scaling
   - Content freshness optimization
   - Learning path customization

5. **Mobile Optimization**
   - Offline recommendations
   - Quick sync protocol
   - Battery-efficient algorithms
