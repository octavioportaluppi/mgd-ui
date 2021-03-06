﻿'use strict';
app.controller('dashboardSupplierController',
	['$scope', 'supplierService', 'ngAuthSettings', 'stateService', 'authService', '$location',
		function ($scope, supplierService, ngAuthSettings, stateService, authService, $location) {

	$scope.supplier = {};
	$scope.dashboard = '';

	$scope.days = [
		{ id: 0, name: 'Domingo'},
		{ id: 1, name: 'Lunes' },
		{ id: 2, name: 'Martes' },
		{ id: 3, name: 'Miercoles' },
		{ id: 4, name: 'Jueves' },
		{ id: 5, name: 'Viernes' },
		{ id: 5, name: 'Sabado' }
	];

	$scope.getDays = function () {
		return $scope.days;
	};

	$scope.getDashboard = function() {
		$scope.editProfile = false;
		$scope.editServices = false;
		$scope.editAboutMe = false;
		$scope.editAnswers = false;
		supplierService
			.getDashboard()
			.then(function(res) {
				$scope.dashboard = res;
				$scope.supplier.City = res.City;
				$scope.supplier.Name = res.Name;
				$scope.supplier.Address = res.Address;
				$scope.supplier.Phone = res.Phone;
				$scope.supplier.Description = res.Description;
				$scope.supplier.FacebookUrl = res.FacebookUrl;
				$scope.supplier.InstagramUrl = res.InstagramUrl;
				$scope.supplier.TwitterUrl = res.TwitterUrl;
				$scope.supplier.State = res.State;
				$scope.supplier.OpeningHours = res.OpeningHours;
				$scope.supplier.OpeningHours.DayFromValue = {id: $scope.supplier.OpeningHours.DayFrom};
				$scope.supplier.OpeningHours.DayToValue = {id: $scope.supplier.OpeningHours.DayTo};
				$scope.supplier.LogoId = res.LogoId;
				$scope.supplier.MaxPics = res.SubscriptionType.MaxPicturesAllowed;
				$scope.supplier.Pictures = res.Pictures
					.filter(function (pic) {
						return !pic.IsLogo;
					})
					.map(function (pic) {
						var result = {};
						result.src = ngAuthSettings.apiServiceBaseUri + '/api/Pictures/' + pic.Id + '/Image';
						result.id = pic.Id;
						return result;
				});
				$scope.supplier.pic = ngAuthSettings.apiServiceBaseUri + '/api/Pictures/' + res.LogoId + '/Image';
				supplierService
					.getAnswers()
					.then(function (response){
						$scope.answers = response.data;
						$scope.questions = [];
						$scope.answers.forEach(function (answer){
							$scope.questions[answer.Id] = answer;
						});
					});
		});
	};
    
	function getProgress() {
		$scope.value = 0;
        if($scope.dashboard.ServiceTypes.length !== 0){
                $scope.value += 0.1;
        }
		for (var field in $scope.supplier) {
			if ( $scope.supplier[field] !== "" && $scope.supplier[field] !== null) {
				delete $scope.supplier.CityId;
				delete $scope.supplier.StateId;
				$scope.value += 0.07;
			}
		}
		var total = $scope.value.toFixed(1);
		return total;
	}

	//britez
	$scope.editServices = false;
	$scope.editAboutMe = false;
	$scope.editProfile = false;
	$scope.editAnswers = false;

	$scope.updateDetails = function(){
		var cityId = $scope.supplier.City.Id;
		$scope.supplier.CityId = cityId;
		delete $scope.supplier.City;
        supplierService
            .updateSupplierProfile($scope.supplier)
            .then(function () {
				$scope.editAboutMe = !$scope.editAboutMe;
                $scope.getDashboard();
            })
	};

	$scope.updateProfile = function(){
		var cityId = $scope.supplier.City.Id;
		$scope.supplier.CityId = cityId;
        supplierService
			.updateSupplierProfile($scope.supplier,
				function () {
					$scope.reload()
				});
	};

	$scope.reload = function () {
		$scope.editProfile = !$scope.editProfile;
		$scope.getDashboard();
	};

	$scope.saveSupplierProfile = function (form, callback){
		if(!form.$valid) {
			return;
		}
		$scope.updateProfile(callback);
	};

	$scope.saveSupplierAboutMe = function (form,callback){
		if(!form.$valid) {
			return;
		}
		$scope.supplier.StateId = $scope.supplier.State.Id;
		$scope.supplier.CityId = $scope.supplier.City.Id;
		$scope.supplier.OpeningHours.DayFrom = $scope.supplier.OpeningHours.DayFromValue.id;
		$scope.supplier.OpeningHours.DayTo = $scope.supplier.OpeningHours.DayToValue.id;
		$scope.updateDetails(callback)
	};

	$scope.updateServices = function (){
		var ids = $scope
			.dashboard
			.ServiceTypes
			.map(function (service) {
				return service.Id;
			});
		supplierService
			.updateSuppliersService(ids)
			.then(function () {
				$scope.editServices = !$scope.editServices;
				$scope.getDashboard();
			})
	};

	$scope.getCities = function() {
		stateService
			.getCities($scope.supplier.State.Id)
			.then(function (response){
				$scope.cities = response.data;
			});
	};

	$scope.updateQuestions = function(form){
		if(!form.$valid){
			return;
		}
		var questions = [];
		$scope.questions.forEach(function (question){
			questions.push({ QuestionId: question.Question.Id, Text: question.Text });
		});
		supplierService
			.saveQuestions(questions)
			.then(function (){
				$scope.getDashboard();
			})
	};

	$scope.haveItem = function(itemId){
		return $scope.dashboard.ServiceTypes.find(function(it){
			return it.Id === itemId;
		})
	};

	//check logged
	if(!authService
			.authentication.isAuth || authService
			.authentication.userType !== 'supplier') {
		$location.path('/login-supplier');
	} else {
		supplierService
			.getServices()
			.then(function (response) {
				$scope.serviceTypes = response.data
			});

		stateService
			.getStates()
			.then(function (response) {
				$scope.states = response.data;
			});

		$scope.getDashboard();

	}

	$scope.isActive = function(currentLocation) {
		return $location.path() == currentLocation;
	};

	$scope.updatePics = function() {
		var toBeDeleted = [];
		var toBeCreated = [];

		if(!$scope.supplier.newPic){
			return;
		}

		for(var i=0; i<$scope.supplier.MaxPics; i++){
			if($scope.supplier.newPic[i] !== undefined){
				if($scope.supplier.Pictures[i])
					toBeDeleted.push($scope.supplier.Pictures[i].id);
				toBeCreated.push($scope.supplier.newPic[i]);
			}
		}
		authService
			.updatePics(toBeDeleted, toBeCreated)
			.then(function () {
				$scope.editPics = false;
				$scope.reload();
			});
		//llamo al servicio para hacer el update
	};

	$scope.getNumber = function (number) {
		return new Array(number);
	};

}]);

