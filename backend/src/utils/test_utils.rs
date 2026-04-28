use mockall::automock;
use async_trait::async_trait;
use uuid::Uuid;

#[automock]
#[async_trait]
pub trait DatabaseRepo: Send + Sync {
    async fn get_user_project_count(&self, user_id: Uuid) -> Result<i64, String>;
}

pub struct ProjectService<R: DatabaseRepo> {
    repo: R,
}

impl<R: DatabaseRepo> ProjectService<R> {
    pub fn new(repo: R) -> Self {
        Self { repo }
    }

    pub async fn can_user_create_project(&self, user_id: Uuid) -> Result<bool, String> {
        let count = self.repo.get_user_project_count(user_id).await?;
        // Limit to 5 projects for standard users
        Ok(count < 5)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_can_user_create_project_with_mock() {
        let mut mock_repo = MockDatabaseRepo::new();
        let user_id = Uuid::new_v4();

        // Scenario: User has 3 projects, should be allowed
        mock_repo.expect_get_user_project_count()
            .with(mockall::predicate::eq(user_id))
            .times(1)
            .returning(|_| Ok(3));

        let service = ProjectService::new(mock_repo);
        let result = service.can_user_create_project(user_id).await.unwrap();
        assert!(result);

        // Scenario: User has 5 projects, should NOT be allowed
        let mut mock_repo_full = MockDatabaseRepo::new();
        mock_repo_full.expect_get_user_project_count()
            .returning(|_| Ok(5));

        let service_full = ProjectService::new(mock_repo_full);
        let result_full = service_full.can_user_create_project(user_id).await.unwrap();
        assert!(!result_full);
    }
}
