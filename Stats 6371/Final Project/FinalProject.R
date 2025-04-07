#Packages
library(olsrr) #maybe need 
library(dplyr)
library(naniar)
library(ggplot2)
library(caret)


#Load the test dataset
housePrice <- read.csv("https://raw.githubusercontent.com/tblakearmstrong/SMU-MSDS/refs/heads/main/Stats%206371/Final%20Project/train.csv", header = TRUE)
housePrice



gg_miss_var(housePrice)

###----------------------------------------- ANALYSIS 1 ---------------------------------------------------------------------------###
housePrice1 = housePrice %>%
  filter(Neighborhood %in% c('NAmes','BrkSide','Edwards')
  ,GrLivArea < 3500)
housePrice1

#Linear assumption plot
ggplot(data = housePrice1, aes(x=GrLivArea, y= SalePrice, color = Neighborhood))+geom_point()+ggtitle("Sales Price vs. Living Area (SqFt) by Neighborhood")+xlab("Living Area (SqFt)") + ylab("Sales Price ($)")

#Separate with interaction terms
fit1_interaction = lm(SalePrice ~ GrLivArea*Neighborhood, data = housePrice1)
summary(fit1_interaction)
AIC(fit1_interaction)
confint(fit1_interaction)


#Generate diagnostic plots
par(mfrow = c(2, 2))  
#Residuals
plot(fit1_interaction, which = 1)
#Q-Q plot
plot(fit1_interaction, which = 2)
#Scale-Location plot
plot(fit1_interaction, which = 3)
# Cook's Distance plot
plot(fit1_interaction, which = 4)


#Leave one out cross-validation
cv_fit1_interaction <- train(SalePrice ~ GrLivArea * Neighborhood, data = housePrice1, method = "lm", trControl = trainControl(method = "LOOCV"))
summary(cv_fit1_interaction)

cv_fit1_interaction$finalModel
cv_fit1_interaction$results

#With outliers for summary stats
housePrice2 = housePrice %>%
  filter(Neighborhood %in% c('NAmes','BrkSide','Edwards'))
housePrice2

fit1_outliers = lm(SalePrice ~ GrLivArea*Neighborhood, data = housePrice2)
summary(fit1_outliers)
AIC(fit1_outliers)


###----------------------------------------- ANALYSIS 2 ---------------------------------------------------------------------------###
###Simple Linear Regression
library(tidyverse)
library(caret)
library(Metrics)

# Select the response variable (SalePrice) and predictor variables
response_var <- "SalePrice"
predictors <- setdiff(names(housePrice), response_var)

# Initialize an empty data frame to store model results
model_results <- data.frame(
  Predictor = character(),
  R_Squared = numeric(),
  RMSE = numeric(),
  AIC = numeric(),
  stringsAsFactors = FALSE
)

# Loop through each predictor and run a regression
for (predictor in predictors) {
  
  # Construct the formula
  formula <- as.formula(paste(response_var, "~", predictor))
  
  # Fit the linear model
  model <- lm(formula, data = housePrice)
  
  # Get model metrics
  model_summary <- summary(model)
  r_squared <- model_summary$r.squared
  aic_value <- AIC(model)
 
   # Ensure 'data' is a data frame and handle missing data in predictions
  predictions <- predict(model, newdata = housePrice)  # Using newdata to ensure correct data input
  rmse_value <- rmse(housePrice[[response_var]], predictions)
  
  # Store results in the data frame
  model_results <- model_results %>%
    add_row(Predictor = predictor, 
            R_Squared = r_squared, 
            RMSE = rmse_value, 
            AIC = aic_value)
}

# Sort the results by R-squared, RMSE or AIC to find the best model
# You can choose one of these depending on what you want to optimize for
best_model <- model_results %>%
  arrange(desc(R_Squared)) %>%  # Use `arrange(RMSE)` or `arrange(AIC)` depending on what you prioritize
  head(1)

# Print the best fitting model
print(best_model)

# Optionally, fit the best model to the data
best_predictor <- best_model$Predictor
best_formula <- as.formula(paste(response_var, "~", best_predictor))
best_final_model <- lm(best_formula, data = housePrice)
summary(best_final_model)


###Multiple Linear Regression


###Custom Multiple Linear Regression 
autofit <- lm(SalePrice ~ .-SalePrice, data=housePrice_filtered)

#Forward
ols_step_forward_p(autofit, penter = 0.05, details = FALSE)

#Backward
ols_step_backward_p(autofit, prem = 0.05, details = TRUE)

#Stepwise
ols_step_both_p(autofit, penter = 0.05, prem = 0.05, details = FALSE)


